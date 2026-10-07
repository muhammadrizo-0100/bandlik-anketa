import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource as TypeOrmDataSource, In } from 'typeorm';
import { SurveyEntity } from '../../database/entities/survey.entity';
import { CitizenEntity } from '../../database/entities/citizen.entity';
import { EmploymentHistoryEntity } from '../../database/entities/employment-history.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { FilterQueueDto } from './dto/filter-queue.dto';
import { ResolveSurveyDto, ReviewAction } from './dto/resolve-survey.dto';
import {
  SurveyStatus,
  DataSource,
  EmploymentCategory,
  UserRole,
} from '../../database/enums';

@Injectable()
export class ReviewQueueService {
  constructor(
    @InjectRepository(SurveyEntity)
    private readonly surveyRepository: Repository<SurveyEntity>,
    @InjectRepository(CitizenEntity)
    private readonly citizenRepository: Repository<CitizenEntity>,
    @InjectRepository(EmploymentHistoryEntity)
    private readonly historyRepository: Repository<EmploymentHistoryEntity>,
    private readonly dataSource: TypeOrmDataSource,
  ) {}

  /**
   * Tekshiruv kutayotgan (ziddiyatli / dublikat) anketalar ro'yxati
   */
  async getQueue(filterDto: FilterQueueDto, user?: UserEntity) {
    const page = Number(filterDto.page) || 1;
    const limit = Number(filterDto.limit) || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.surveyRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.citizen', 'citizen')
      .leftJoinAndSelect('s.operator', 'operator')
      .leftJoinAndSelect('s.mahalla', 'mahalla')
      .where('s.status = :status', { status: SurveyStatus.PENDING_REVIEW });

    if (user) {
      if (user.roleCode === UserRole.MAHALLA_OPERATOR && user.mahallaId) {
        queryBuilder.andWhere('s.mahallaId = :userMahallaId', {
          userMahallaId: user.mahallaId,
        });
      } else if (user.roleCode === UserRole.DISTRICT_ADMIN && user.districtId) {
        queryBuilder.andWhere('mahalla.districtId = :userDistrictId', {
          userDistrictId: user.districtId,
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

    if (filterDto.districtId) {
      queryBuilder.andWhere('mahalla.districtId = :filterDistrictId', {
        filterDistrictId: filterDto.districtId,
      });
    }

    if (filterDto.mahallaId) {
      queryBuilder.andWhere('s.mahallaId = :mahallaId', {
        mahallaId: filterDto.mahallaId,
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
   * Tekshiruv kutayotgan anketalar umumiy soni (Dashboard bildirishnomasi uchun)
   */
  async getPendingCount(user?: UserEntity): Promise<{ count: number }> {
    const queryBuilder = this.surveyRepository
      .createQueryBuilder('s')
      .leftJoin('s.mahalla', 'mahalla')
      .where('s.status = :status', { status: SurveyStatus.PENDING_REVIEW });

    if (user) {
      if (user.roleCode === UserRole.MAHALLA_OPERATOR && user.mahallaId) {
        queryBuilder.andWhere('s.mahallaId = :userMahallaId', {
          userMahallaId: user.mahallaId,
        });
      } else if (user.roleCode === UserRole.DISTRICT_ADMIN && user.districtId) {
        queryBuilder.andWhere('mahalla.districtId = :userDistrictId', {
          userDistrictId: user.districtId,
        });
      }
    }

    const count = await queryBuilder.getCount();
    return { count };
  }

  /**
   * Bitta tekshiruv elementi tafsilotlari (Ziddiyatli anketa vs Bazadagi fuqaro taqqoslashi)
   */
  async getQueueItem(id: string) {
    const survey = await this.surveyRepository.findOne({
      where: { id },
      relations: {
        citizen: {
          mahalla: {
            district: true,
          },
          district: true,
          employmentHistory: {
            changedBy: true,
          },
        },
        operator: true,
        mahalla: {
          district: true,
        },
        district: true,
      },
    });

    if (!survey) {
      throw new NotFoundException(`So'rovnoma topilmadi (ID: ${id})`);
    }

    if (survey.status !== SurveyStatus.PENDING_REVIEW) {
      throw new BadRequestException(
        `Ushbu so'rovnoma allaqachon ko'rib chiqilgan (Status: ${survey.status})`,
      );
    }

    return {
      pendingSurvey: survey,
      existingCitizen: survey.citizen,
    };
  }

  /**
   * Tekshiruv xulosasini qabul qilish va qaror chiqarish (Resolve / Reject)
   */
  async resolve(
    id: string,
    dto: ResolveSurveyDto,
    reviewer: UserEntity,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // Bir vaqtning o'zida bir nechta xodim qabul qilishini oldini olish uchun qat'iy row-level lock (pessimistic_write)
      const survey = await manager.findOne(SurveyEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!survey) {
        throw new NotFoundException(`So'rovnoma topilmadi (ID: ${id})`);
      }

      if (survey.status !== SurveyStatus.PENDING_REVIEW) {
        throw new BadRequestException(
          `Ushbu so'rovnoma allaqachon boshqa mas'ul xodim tomonidan ko'rib chiqilgan (Status: ${survey.status})`,
        );
      }

      // 1. Agar tasdiqlansa (APPROVE_UPDATE) -> Fuqaroning holati yangilanadi
      if (dto.action === ReviewAction.APPROVE_UPDATE) {
        if (!survey.citizenId) {
          throw new BadRequestException(
            'Bog\'langan fuqaro topilmadi, to\'g\'ridan to\'g\'ri tasdiqlab bo\'lmaydi',
          );
        }

        const citizen = await manager.findOne(CitizenEntity, {
          where: { id: survey.citizenId },
        });

        if (!citizen) {
          throw new NotFoundException('Fuqaro topilmadi');
        }

        const previousCategory = citizen.currentCategory;
        const previousDetails = {
          category: citizen.currentCategory,
          statusDetail: citizen.currentStatusDetail,
        };

        const newDetails = {
          category: survey.mainCategory,
          officialWorkplace: survey.officialWorkplace,
          selfEmployedActivity: survey.selfEmployedActivity,
          selfEmployedRegistered: survey.selfEmployedRegistered,
          unofficialActivityType: survey.unofficialActivityType,
          migrantCountry: survey.migrantCountry,
          migrantDuration: survey.migrantDuration,
          noWishReason: survey.noWishReason,
          unemployedDirections: survey.unemployedDirections,
          unemployedAdditionalNote: survey.unemployedAdditionalNote,
          otherReasonNote: survey.otherReasonNote,
        };

        // Fuqaroning joriy holatini yangilash
        citizen.currentCategory = survey.mainCategory;
        citizen.currentStatusDetail = this.formatStatusSummary(survey);
        await manager.save(CitizenEntity, citizen);

        const noteText = dto.reviewerNote?.trim() || 'Tasdiqlandi va rasmiy roʻyxatga olindi';

        // Tarix (History) jadvaliga yozuv qo'shish
        const history = manager.create(EmploymentHistoryEntity, {
          citizenId: citizen.id,
          surveyId: survey.id,
          previousCategory,
          previousDetails,
          newCategory: survey.mainCategory,
          newDetails,
          changedById: reviewer.id,
          changeReason: noteText,
          dataSource: DataSource.MANUAL_AUDIT,
        });
        await manager.save(EmploymentHistoryEntity, history);

        // So'rovnoma holatini yangilash
        survey.status = SurveyStatus.RESOLVED;
        survey.reviewerId = reviewer.id;
        survey.reviewedAt = new Date();
        survey.reviewerNote = noteText;
        await manager.save(SurveyEntity, survey);

        return {
          success: true,
          action: dto.action,
          message:
            'So\'rovnoma muvaffaqiyatli tasdiqlandi va fuqaroning bandlik holati yangilandi',
          survey,
        };
      }

      // 2. Agar rad etilsa (REJECT)
      if (survey.citizenId) {
        const otherSurveysCount = await manager.count(SurveyEntity, {
          where: { citizenId: survey.citizenId },
        });

        // Agar fuqaroning tizimda boshqa birorta ham anketasi bo'lmasa (masalan, onlayn yuborilib rad etilgan bo'lsa),
        // tasdiqlanmagan soxta fuqaro yozuvini ham butunlay tozalab tashlaymiz
        if (otherSurveysCount <= 1) {
          const citizen = await manager.findOne(CitizenEntity, {
            where: { id: survey.citizenId },
          });
          await manager.remove(SurveyEntity, survey);
          if (citizen) {
            await manager.remove(CitizenEntity, citizen);
          }
          return {
            success: true,
            action: dto.action,
            message: 'Soʻrovnoma rad etildi va roʻyxatdan butunlay bekor qilindi (oʻchirildi).',
          };
        }
      }

      // Agar fuqaroning oldingi tasdiqlangan ma'lumotlari mavjud bo'lsa,
      // faqatgina ushbu yangi ziddiyatli/rad etilgan so'rovnomani o'chirib tashlaymiz
      await manager.remove(SurveyEntity, survey);
      return {
        success: true,
        action: dto.action,
        message: 'Ziddiyatli soʻrovnoma rad etildi va roʻyxatdan chiqarildi. Fuqaroning amaldagi bazadagi holati oʻzgarishsiz qoldi.',
      };
    });
  }

  private formatStatusSummary(survey: SurveyEntity): string {
    switch (survey.mainCategory) {
      case EmploymentCategory.OFFICIALLY_EMPLOYED:
        return `Rasmiy band: ${survey.officialWorkplace || ''}`;
      case EmploymentCategory.SELF_EMPLOYED:
        return `Oʻzini band qilgan: ${survey.selfEmployedActivity || ''}`;
      case EmploymentCategory.UNOFFICIALLY_EMPLOYED:
        return `Norasmiy band: ${survey.unofficialActivityType || ''}`;
      case EmploymentCategory.MIGRANT:
        return `Migrant: ${survey.migrantCountry || ''}`;
      case EmploymentCategory.NO_WISH_TO_WORK:
        return `Ishlash istagi yo'q: ${survey.noWishReason || ''}`;
      case EmploymentCategory.UNEMPLOYED:
        return `Ishsiz (Yo'nalishlar: ${(survey.unemployedDirections || []).join(', ')})`;
      case EmploymentCategory.OTHER:
        return `Boshqa: ${survey.otherReasonNote || ''}`;
      default:
        return '';
    }
  }
}
