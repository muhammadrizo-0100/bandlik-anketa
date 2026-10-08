import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Subject } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource as TypeOrmDataSource } from 'typeorm';
import { SurveyEntity } from '../../database/entities/survey.entity';
import { CitizenEntity } from '../../database/entities/citizen.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { EmploymentHistoryEntity } from '../../database/entities/employment-history.entity';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { FilterSurveyDto } from './dto/filter-survey.dto';
import {
  SurveyStatus,
  SurveyMethod,
  UserRole,
  DataSource,
  EmploymentCategory,
  NoWishReason,
} from '../../database/enums';

@Injectable()
export class SurveysService {
  private readonly surveyEventsSubject = new Subject<{
    type: string;
    data?: any;
  }>();

  get surveyEvents$() {
    return this.surveyEventsSubject.asObservable();
  }

  constructor(
    @InjectRepository(SurveyEntity)
    private readonly surveyRepository: Repository<SurveyEntity>,
    @InjectRepository(CitizenEntity)
    private readonly citizenRepository: Repository<CitizenEntity>,
    @InjectRepository(MahallaEntity)
    private readonly mahallaRepository: Repository<MahallaEntity>,
    @InjectRepository(EmploymentHistoryEntity)
    private readonly historyRepository: Repository<EmploymentHistoryEntity>,
    private readonly dataSource: TypeOrmDataSource,
  ) {}

  /**
   * Fuqaroning ochiq portaldan mustaqil yuborgan anketasini qabul qilish
   */
  async createPublic(dto: CreateSurveyDto) {
    if (!dto.mahallaId && !dto.customMahallaName) {
      throw new BadRequestException('Mahalla tanlanishi yoki qo\'lda kiritilishi shart');
    }
    if (!dto.mahallaId && !dto.districtId) {
      throw new BadRequestException('Yangi mahalla kiritish uchun tuman tanlanishi shart');
    }

    // Yosh chegarasini tekshirish (18 - 60 yosh)
    const birth = new Date(dto.birthDate);
    if (isNaN(birth.getTime())) {
      throw new BadRequestException('Tug\'ilgan sana formati noto\'g\'ri');
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) {
      throw new BadRequestException(
        `Fuqaro yoshi ${age} da (voyaga yetmagan bola). Bandlik monitoringiga faqat 18 yoshga to'lgan fuqarolar kiritiladi`,
      );
    }
    if (age > 60) {
      throw new BadRequestException(
        `Fuqaro yoshi ${age} da. Bandlik monitoringi 18 dan 60 yoshgacha bo'lgan fuqarolar uchun o'tkaziladi`,
      );
    }

    let targetDistrictId = dto.districtId;
    if (dto.mahallaId) {
      const existingMahalla = await this.mahallaRepository.findOne({ where: { id: dto.mahallaId } });
      if (!existingMahalla) {
        throw new NotFoundException(`Mahalla topilmadi (ID: ${dto.mahallaId})`);
      }
      targetDistrictId = existingMahalla.districtId;
    }

    const userRepo = this.dataSource.getRepository(UserEntity);
    // Ushbu mahallaga biriktirilgan operatorni topish, bo'lmasa tuman admini yoki super admin
    let operator: UserEntity | null = null;
    if (dto.mahallaId) {
      operator = await userRepo.findOne({
        where: { mahallaId: dto.mahallaId, roleCode: UserRole.MAHALLA_OPERATOR },
      });
    }
    if (!operator && targetDistrictId) {
      operator = await userRepo.findOne({
        where: { districtId: targetDistrictId, roleCode: UserRole.DISTRICT_ADMIN },
      });
    }
    if (!operator) {
      operator = await userRepo.findOne({
        where: { roleCode: UserRole.SUPER_ADMIN },
      });
    }

    const operatorId = operator?.id;
    if (!operatorId) {
      throw new BadRequestException('Tizimda mas\'ul xodim topilmadi');
    }

    // 1. Agar ushbu JSHSHIR bo'yicha ayni paytda ko'rib chiqilayotgan (PENDING_REVIEW) so'rovnoma bo'lsa, qayta yuborishni bloklash!
    const pendingSurvey = await this.surveyRepository.findOne({
      where: {
        citizenPinfl: dto.pinfl.trim(),
        status: SurveyStatus.PENDING_REVIEW,
      },
    });

    if (pendingSurvey) {
      throw new BadRequestException(
        `Ushbu JSHSHIR (${dto.pinfl.trim()}) boʻyicha yuborilgan soʻrovnoma ayni paytda masʼul xodimlar tomonidan koʻrib chiqilmoqda. Qayta ariza yuborish shart emas, iltimos javobni kuting.`,
      );
    }

    const existingCitizen = await this.citizenRepository.findOne({
      where: { pinfl: dto.pinfl.trim() },
      relations: { mahalla: true, district: true },
    });

    return this.dataSource.transaction(async (manager) => {
      let finalMahallaId = dto.mahallaId;
      let mahallaName = '';

      if (!finalMahallaId && dto.customMahallaName && targetDistrictId) {
        let mahalla = await manager.findOne(MahallaEntity, {
          where: { name: dto.customMahallaName, districtId: targetDistrictId }
        });
        if (!mahalla) {
          mahalla = manager.create(MahallaEntity, {
            name: dto.customMahallaName,
            districtId: targetDistrictId,
            region: 'Namangan viloyati',
          });
          mahalla = await manager.save(MahallaEntity, mahalla);
        }
        finalMahallaId = mahalla.id;
        mahallaName = mahalla.name;
      } else if (finalMahallaId) {
        const m = await manager.findOne(MahallaEntity, { where: { id: finalMahallaId }});
        if (m) mahallaName = m.name;
      }

      let citizenId = existingCitizen?.id;

      if (!existingCitizen) {
        const citizen = manager.create(CitizenEntity, {
          fullName: dto.fullName.trim(),
          birthDate: new Date(dto.birthDate),
          pinfl: dto.pinfl.trim(),
          phone: dto.phone?.trim(),
          parentPhone: dto.parentPhone?.trim(),
          address: dto.address?.trim() || `${mahallaName} MFY`,
          education: dto.education?.trim() || 'O\'rta',
          specialty: dto.specialty?.trim(),
          districtId: targetDistrictId,
          mahallaId: finalMahallaId,
          currentCategory: dto.mainCategory,
          currentStatusDetail: this.formatStatusSummary(dto),
        });
        const saved = await manager.save(CitizenEntity, citizen);
        citizenId = saved.id;
      }

      // Online anketa doimo PENDING_REVIEW holatida tushadi!
      const survey = manager.create(SurveyEntity, {
        citizenId,
        citizenPinfl: dto.pinfl.trim(),
        citizenFullName: dto.fullName.trim(),
        operatorId,
        districtId: targetDistrictId,
        mahallaId: finalMahallaId,
        surveyDate: dto.surveyDate ? new Date(dto.surveyDate) : new Date(),
        surveyMethod: SurveyMethod.ONLINE,
        dataSource: DataSource.CITIZEN_PUBLIC,
        status: SurveyStatus.PENDING_REVIEW,
        conflictReason: existingCitizen
          ? `Fuqaro tomonidan onlayn yuborildi. Diqqat: Ushbu JSHSHIR bazada oldin mavjud bo'lgan (${existingCitizen.fullName}).`
          : 'Fuqaro tomonidan onlayn portal orqali mustaqil to\'ldirildi. Mas\'ul xodim tekshiruvi talab etiladi.',
        mainCategory: dto.mainCategory,
        officialWorkplace: dto.officialWorkplace,
        selfEmployedActivity: dto.selfEmployedActivity,
        selfEmployedRegistered: dto.selfEmployedRegistered,
        unofficialActivityType: dto.unofficialActivityType,
        migrantCountry: dto.migrantCountry,
        migrantDuration: dto.migrantDuration,
        noWishReason: dto.noWishReason,
        unemployedDirections: dto.unemployedDirections,
        unemployedAdditionalNote: dto.unemployedAdditionalNote,
        otherReasonNote: dto.otherReasonNote,
        citizenSigned: true,
        operatorSigned: false,
      });

      const savedSurvey = await manager.save(SurveyEntity, survey);

      // Real-time bildirishnoma oqimiga yuborish
      try {
        this.surveyEventsSubject.next({
          type: 'NEW_SURVEY',
          data: {
            id: savedSurvey.id,
            citizenFullName: savedSurvey.citizenFullName,
            citizenPinfl: savedSurvey.citizenPinfl,
            mahallaId: savedSurvey.mahallaId,
            mahallaName: mahallaName || undefined,
            districtId: savedSurvey.districtId,
            surveyMethod: savedSurvey.surveyMethod,
            mainCategory: savedSurvey.mainCategory,
            createdAt: savedSurvey.createdAt ? savedSurvey.createdAt.toISOString() : new Date().toISOString(),
          },
        });
      } catch (err) {
        // SSE xatoligi tranzaksiyaga ta'sir qilmaydi
      }

      return {
        isConflict: false,
        message:
          'Arizangiz muvaffaqiyatli qabul qilindi. Mahalla yetakchisi ma\'lumotlarni ko\'rib chiqib, tez orada siz bilan bog\'lanadi.',
        survey: savedSurvey,
      };
    });
  }

  /**
   * Yangi anketa yuborish (Operator yoki Admin)
   */
  async create(dto: CreateSurveyDto, currentUser: UserEntity) {
    // 1. Mahalla aniqlash va tekshirish
    let targetMahallaId = dto.mahallaId;

    if (currentUser.roleCode === UserRole.MAHALLA_OPERATOR) {
      if (!currentUser.mahallaId) {
        throw new ForbiddenException(
          'Sizga mahalla biriktirilmagan. Anketa to\'ldira olmaysiz.',
        );
      }
      targetMahallaId = currentUser.mahallaId;
    }

    if (!targetMahallaId) {
      throw new BadRequestException('Mahalla tanlanishi shart');
    }

    const mahalla = await this.mahallaRepository.findOne({
      where: { id: targetMahallaId },
      relations: { district: true },
    });
    if (!mahalla) {
      throw new NotFoundException(`Mahalla topilmadi (ID: ${targetMahallaId})`);
    }

    const targetDistrictId = mahalla.districtId;

    // 1.5. Yosh chegarasini tekshirish (18 - 60 yosh)
    const birth = new Date(dto.birthDate);
    if (isNaN(birth.getTime())) {
      throw new BadRequestException('Tug\'ilgan sana formati noto\'g\'ri');
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 18) {
      throw new BadRequestException(
        `Fuqaro yoshi ${age} da (voyaga yetmagan bola). Bandlik monitoringiga faqat 18 yoshga to'lgan fuqarolar kiritiladi`,
      );
    }
    if (age > 60) {
      throw new BadRequestException(
        `Fuqaro yoshi ${age} da. Bandlik monitoringi 18 dan 60 yoshgacha bo'lgan fuqarolar uchun o'tkaziladi`,
      );
    }

    // 2. JSHSHIR dublikati va ziddiyatlarni tekshirish (Conflict Queue mantiqi)
    const existingCitizen = await this.citizenRepository.findOne({
      where: { pinfl: dto.pinfl },
      relations: { mahalla: true, district: true },
    });

    // Tranzaksiya orqali xavfsiz saqlash
    return this.dataSource.transaction(async (manager) => {
      const newDetails = this.extractDetails(dto);

      // Agar fuqaro allaqachon mavjud bo'lsa -> Ziddiyat! Review Queue ga yo'naltirish
      if (existingCitizen) {
        const conflictReason = `Ushbu JSHSHIR (${dto.pinfl}) bo'yicha fuqaro allaqachon mavjud (${existingCitizen.fullName}, ${existingCitizen.mahalla?.name || 'boshqa mahalla'}). Yangi so'rovnoma tekshiruv navbatiga yo'naltirildi.`;

        const survey = manager.create(SurveyEntity, {
          citizenId: existingCitizen.id,
          citizenPinfl: dto.pinfl,
          citizenFullName: dto.fullName,
          operatorId: currentUser.id,
          districtId: targetDistrictId,
          mahallaId: targetMahallaId,
          surveyDate: new Date(dto.surveyDate),
          surveyMethod: dto.surveyMethod,
          mainCategory: dto.mainCategory,
          officialWorkplace: dto.officialWorkplace,
          unofficialActivityType: dto.unofficialActivityType,
          noWishReason: dto.noWishReason,
          unemployedDirections: dto.unemployedDirections,
          unemployedAdditionalNote: dto.unemployedAdditionalNote,
          otherReasonNote: dto.otherReasonNote,
          citizenSigned: dto.citizenSigned ?? true,
          operatorSigned: dto.operatorSigned ?? true,
          status: SurveyStatus.PENDING_REVIEW,
          conflictReason,
          dataSource: DataSource.SURVEY_OPERATOR,
        });

        const savedSurvey = await manager.save(SurveyEntity, survey);

        return {
          isConflict: true,
          message:
            'Diqqat: Ushbu JSHSHIR bo\'yicha fuqaro oldin ro\'yxatga olingan. So\'rovnoma tekshiruvchi (Data Reviewer) navbatiga yuborildi.',
          survey: savedSurvey,
        };
      }

      // Agar fuqaro bazada bo'lmasa -> Yangi fuqaroni yaratish
      const citizen = manager.create(CitizenEntity, {
        fullName: dto.fullName,
        birthDate: new Date(dto.birthDate),
        pinfl: dto.pinfl,
        phone: dto.phone,
        parentPhone: dto.parentPhone,
        address: dto.address,
        education: dto.education,
        specialty: dto.specialty,
        districtId: targetDistrictId,
        mahallaId: targetMahallaId,
        currentCategory: dto.mainCategory,
        currentStatusDetail: this.formatStatusSummary(dto),
      });

      const savedCitizen = await manager.save(CitizenEntity, citizen);

      // So'rovnomani saqlash (APPROVED holatda)
      const survey = manager.create(SurveyEntity, {
        citizenId: savedCitizen.id,
        citizenPinfl: dto.pinfl,
        citizenFullName: dto.fullName,
        operatorId: currentUser.id,
        districtId: targetDistrictId,
        mahallaId: targetMahallaId,
        surveyDate: new Date(dto.surveyDate),
        surveyMethod: dto.surveyMethod,
        mainCategory: dto.mainCategory,
        officialWorkplace: dto.officialWorkplace,
        selfEmployedActivity: dto.selfEmployedActivity,
        selfEmployedRegistered: dto.selfEmployedRegistered,
        unofficialActivityType: dto.unofficialActivityType,
        migrantCountry: dto.migrantCountry,
        migrantDuration: dto.migrantDuration,
        noWishReason: dto.noWishReason,
        unemployedDirections: dto.unemployedDirections,
        unemployedAdditionalNote: dto.unemployedAdditionalNote,
        otherReasonNote: dto.otherReasonNote,
        citizenSigned: dto.citizenSigned ?? true,
        operatorSigned: dto.operatorSigned ?? true,
        status: SurveyStatus.APPROVED,
        dataSource: DataSource.SURVEY_OPERATOR,
      });

      const savedSurvey = await manager.save(SurveyEntity, survey);

      // EmploymentHistory ga birlamchi log yozuvi kiritiladi
      const history = manager.create(EmploymentHistoryEntity, {
        citizenId: savedCitizen.id,
        surveyId: savedSurvey.id,
        previousCategory: undefined,
        previousDetails: undefined,
        newCategory: dto.mainCategory,
        newDetails: { note: newDetails, raw: dto },
        changedById: currentUser.id,
        changeReason: 'Birlamchi raqamli so\'rovnoma to\'ldirildi',
        dataSource: DataSource.SURVEY_OPERATOR,
      });

      await manager.save(EmploymentHistoryEntity, history);

      return {
        isConflict: false,
        message: 'So\'rovnoma muvaffaqiyatli qabul qilindi va bazaga kiritildi',
        survey: savedSurvey,
        citizen: savedCitizen,
      };
    });
  }

  /**
   * So'rovnomalar ro'yxati (Operator, District Admin, Super Admin va Reviewer uchun ruxsatlar bilan)
   */
  async findAll(filterDto: FilterSurveyDto & { districtId?: string }, currentUser: UserEntity) {
    const page = Number(filterDto.page) || 1;
    const limit = Number(filterDto.limit) || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.surveyRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.citizen', 'citizen')
      .leftJoinAndSelect('s.operator', 'operator')
      .leftJoinAndSelect('s.district', 'district')
      .leftJoinAndSelect('s.mahalla', 'mahalla');

    if (currentUser.roleCode === UserRole.MAHALLA_OPERATOR) {
      queryBuilder.andWhere('s.mahallaId = :operatorMahallaId', {
        operatorMahallaId: currentUser.mahallaId,
      });
    } else if (currentUser.roleCode === UserRole.DISTRICT_ADMIN) {
      queryBuilder.andWhere('s.districtId = :adminDistrictId', {
        adminDistrictId: currentUser.districtId,
      });
      if (filterDto.mahallaId) {
        queryBuilder.andWhere('s.mahallaId = :mahallaId', {
          mahallaId: filterDto.mahallaId,
        });
      }
    } else {
      if (filterDto.districtId) {
        queryBuilder.andWhere('s.districtId = :districtId', {
          districtId: filterDto.districtId,
        });
      }
      if (filterDto.mahallaId) {
        queryBuilder.andWhere('s.mahallaId = :mahallaId', {
          mahallaId: filterDto.mahallaId,
        });
      }
    }

    if (filterDto.search && filterDto.search.trim()) {
      const cleanSearch = filterDto.search.trim();
      const cleanDigits = cleanSearch.replace(/\D/g, '');
      if (cleanDigits.length >= 4) {
        queryBuilder.andWhere(
          '(LOWER(s.citizenFullName) LIKE LOWER(:search) OR s.citizenPinfl LIKE :digits OR citizen.phone LIKE :search OR citizen.parentPhone LIKE :search OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(citizen.phone, \'\'), \' \', \'\'), \'-\', \'\'), \'(\', \'\'), \')\', \'\') LIKE :digits)',
          { search: `%${cleanSearch}%`, digits: `%${cleanDigits}%` },
        );
      } else {
        queryBuilder.andWhere(
          '(LOWER(s.citizenFullName) LIKE LOWER(:search) OR s.citizenPinfl LIKE :search OR citizen.phone LIKE :search)',
          { search: `%${cleanSearch}%` },
        );
      }
    }

    if (filterDto.status) {
      if ((filterDto.status as string) === 'APPROVED') {
        queryBuilder.andWhere('s.status IN (:...appStatuses)', {
          appStatuses: [SurveyStatus.APPROVED, SurveyStatus.RESOLVED],
        });
      } else {
        queryBuilder.andWhere('s.status = :status', { status: filterDto.status });
      }
    }

    if (filterDto.category) {
      queryBuilder.andWhere('s.mainCategory = :category', {
        category: filterDto.category,
      });
    }

    if (filterDto.method) {
      queryBuilder.andWhere('s.surveyMethod = :method', {
        method: filterDto.method,
      });
    }

    if (filterDto.operatorId) {
      queryBuilder.andWhere('s.operatorId = :operatorId', {
        operatorId: filterDto.operatorId,
      });
    }

    if (filterDto.startDate) {
      queryBuilder.andWhere('s.surveyDate >= :startDate', {
        startDate: filterDto.startDate,
      });
    }

    if (filterDto.endDate) {
      queryBuilder.andWhere('s.surveyDate <= :endDate', {
        endDate: filterDto.endDate,
      });
    }

    queryBuilder
      .orderBy('s.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Bitta so'rovnomani ID bo'yicha to'liq ko'rish
   */
  async findOne(id: string, currentUser: UserEntity) {
    const survey = await this.surveyRepository.findOne({
      where: { id },
      relations: {
        citizen: true,
        operator: true,
        district: true,
        mahalla: true,
        reviewer: true,
        employmentHistories: true,
      },
    });

    if (!survey) {
      throw new NotFoundException(`So'rovnoma topilmadi (ID: ${id})`);
    }

    if (
      currentUser.roleCode === UserRole.MAHALLA_OPERATOR &&
      survey.mahallaId !== currentUser.mahallaId
    ) {
      throw new ForbiddenException('Siz faqat o\'z mahallangiz so\'rovnomalarini ko\'rishingiz mumkin');
    }

    if (
      currentUser.roleCode === UserRole.DISTRICT_ADMIN &&
      survey.districtId !== currentUser.districtId
    ) {
      throw new ForbiddenException('Siz faqat o\'z tumaningiz so\'rovnomalarini ko\'rishingiz mumkin');
    }

    return survey;
  }

  // ==========================================
  // YORDAMCHI FORMATLASH METODLARI
  // ==========================================
  private extractDetails(dto: CreateSurveyDto): string {
    switch (dto.mainCategory) {
      case EmploymentCategory.OFFICIALLY_EMPLOYED:
        return dto.officialWorkplace || 'Rasmiy band';
      case EmploymentCategory.SELF_EMPLOYED:
        return dto.selfEmployedActivity ? `Oʻzini band qilgan: ${dto.selfEmployedActivity}` : 'Oʻzini band qilgan';
      case EmploymentCategory.UNOFFICIALLY_EMPLOYED:
        return dto.unofficialActivityType || 'Norasmiy band';
      case EmploymentCategory.MIGRANT:
        return dto.migrantCountry ? `Migrant: ${dto.migrantCountry}` : 'Migrant';
      case EmploymentCategory.NO_WISH_TO_WORK:
        return `Istagi yo'q: ${this.translateNoWish(dto.noWishReason)}`;
      case EmploymentCategory.UNEMPLOYED:
        return `Ishsiz: ${(dto.unemployedDirections || []).join(', ')}${
          dto.unemployedAdditionalNote ? ` (${dto.unemployedAdditionalNote})` : ''
        }`;
      case EmploymentCategory.OTHER:
        return dto.otherReasonNote || 'Boshqa sabab';
      default:
        return 'Aniqlanmagan';
    }
  }

  private formatStatusSummary(dto: CreateSurveyDto): string {
    return this.extractDetails(dto);
  }

  private translateNoWish(reason?: NoWishReason): string {
    switch (reason) {
      case NoWishReason.CHILD_CARE:
        return 'Bola tarbiyasida';
      case NoWishReason.HOUSEWIFE:
        return 'Uy bekasi';
      case NoWishReason.WEALTHY_FAMILY:
        return 'O\'ziga to\'q oila';
      case NoWishReason.APPLICANT:
        return 'Abituriyent';
      default:
        return 'Sabab ko\'rsatilmagan';
    }
  }
}
