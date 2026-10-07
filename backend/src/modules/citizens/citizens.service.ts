import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CitizenEntity } from '../../database/entities/citizen.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { FilterCitizenDto } from './dto/filter-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { UserEntity } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums';

@Injectable()
export class CitizensService {
  constructor(
    @InjectRepository(CitizenEntity)
    private readonly citizenRepository: Repository<CitizenEntity>,
    @InjectRepository(MahallaEntity)
    private readonly mahallaRepository: Repository<MahallaEntity>,
  ) {}

  /**
   * Fuqarolar ro'yxati (Rollar bo'yicha qat'iy cheklovlar bilan)
   */
  async findAll(filterDto: FilterCitizenDto & { districtId?: string }, currentUser: UserEntity) {
    const page = Number(filterDto.page) || 1;
    const limit = Number(filterDto.limit) || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.citizenRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.district', 'district')
      .leftJoinAndSelect('c.mahalla', 'mahalla');

    // Mahalla operatori faqat o'ziga biriktirilgan mahalla fuqarolarini ko'radi
    if (currentUser.roleCode === UserRole.MAHALLA_OPERATOR) {
      if (!currentUser.mahallaId) {
        throw new ForbiddenException(
          'Sizga mahalla biriktirilmagan. Administratorga murojaat qiling.',
        );
      }
      queryBuilder.andWhere('c.mahallaId = :operatorMahallaId', {
        operatorMahallaId: currentUser.mahallaId,
      });
    } else if (currentUser.roleCode === UserRole.DISTRICT_ADMIN) {
      queryBuilder.andWhere('c.districtId = :adminDistrictId', {
        adminDistrictId: currentUser.districtId,
      });
      if (filterDto.mahallaId) {
        queryBuilder.andWhere('c.mahallaId = :mahallaId', {
          mahallaId: filterDto.mahallaId,
        });
      }
    } else {
      if (filterDto.districtId) {
        queryBuilder.andWhere('c.districtId = :districtId', {
          districtId: filterDto.districtId,
        });
      }
      if (filterDto.mahallaId) {
        queryBuilder.andWhere('c.mahallaId = :mahallaId', {
          mahallaId: filterDto.mahallaId,
        });
      }
    }

    if (filterDto.search && filterDto.search.trim()) {
      const cleanSearch = filterDto.search.trim();
      const cleanDigits = cleanSearch.replace(/\D/g, '');
      if (cleanDigits.length >= 4) {
        queryBuilder.andWhere(
          '(LOWER(c.fullName) LIKE LOWER(:search) OR c.pinfl LIKE :digits OR c.phone LIKE :search OR c.parentPhone LIKE :search OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(c.phone, \'\'), \' \', \'\'), \'-\', \'\'), \'(\', \'\'), \')\', \'\') LIKE :digits OR REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(c.parentPhone, \'\'), \' \', \'\'), \'-\', \'\'), \'(\', \'\'), \')\', \'\') LIKE :digits)',
          { search: `%${cleanSearch}%`, digits: `%${cleanDigits}%` },
        );
      } else {
        queryBuilder.andWhere(
          '(LOWER(c.fullName) LIKE LOWER(:search) OR c.pinfl LIKE :search OR c.phone LIKE :search OR c.parentPhone LIKE :search)',
          { search: `%${cleanSearch}%` },
        );
      }
    }

    if (filterDto.pinfl) {
      queryBuilder.andWhere('c.pinfl = :pinfl', { pinfl: filterDto.pinfl });
    }

    if (filterDto.category) {
      queryBuilder.andWhere('c.currentCategory = :category', {
        category: filterDto.category,
      });
    }

    queryBuilder
      .orderBy('c.createdAt', 'DESC')
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
   * JSHSHIR bo'yicha fuqaroni qidirish
   */
  async findByPinfl(pinfl: string, currentUser?: UserEntity): Promise<CitizenEntity | null> {
    const citizen = await this.citizenRepository.findOne({
      where: { pinfl },
      relations: {
        district: true,
        mahalla: true,
        employmentHistory: {
          changedBy: true,
        },
      },
    });

    return citizen;
  }

  /**
   * Fuqaroni ID bo'yicha olish (Barcha anketalari va bandlik tarixi bilan)
   */
  async findOne(id: string, currentUser: UserEntity): Promise<CitizenEntity> {
    const citizen = await this.citizenRepository.findOne({
      where: { id },
      relations: {
        district: true,
        mahalla: true,
        surveys: {
          operator: true,
        },
        employmentHistory: {
          changedBy: true,
        },
      },
    });

    if (!citizen) {
      throw new NotFoundException(`Fuqaro topilmadi (ID: ${id})`);
    }

    if (
      currentUser.roleCode === UserRole.MAHALLA_OPERATOR &&
      citizen.mahallaId !== currentUser.mahallaId
    ) {
      throw new ForbiddenException(
        'Siz faqat o\'z mahallangizga tegishli fuqarolar ma\'lumotini ko\'ra olasiz',
      );
    }

    if (
      currentUser.roleCode === UserRole.DISTRICT_ADMIN &&
      citizen.districtId !== currentUser.districtId
    ) {
      throw new ForbiddenException(
        'Siz faqat o\'z tumaningizga tegishli fuqarolar ma\'lumotini ko\'ra olasiz',
      );
    }

    return citizen;
  }

  /**
   * Fuqaro ma'lumotlarini tahrirlash (Superadmin, District Admin, Mahalla xodimi)
   */
  async update(id: string, updateDto: UpdateCitizenDto, currentUser: UserEntity) {
    const citizen = await this.citizenRepository.findOne({
      where: { id },
      relations: { district: true, mahalla: true },
    });

    if (!citizen) {
      throw new NotFoundException(`Fuqaro topilmadi (ID: ${id})`);
    }

    // Rol bo'yicha ruxsatlarni tekshirish
    if (currentUser.roleCode === UserRole.MAHALLA_OPERATOR) {
      if (citizen.mahallaId !== currentUser.mahallaId) {
        throw new ForbiddenException(
          'Siz faqat o\'z mahallangizga tegishli fuqarolar ma\'lumotini tahrirlay olasiz',
        );
      }
      if (updateDto.mahallaId && updateDto.mahallaId !== currentUser.mahallaId) {
        throw new ForbiddenException(
          'Mahalla xodimi fuqaroni boshqa mahallaga ko\'chira olmaydi',
        );
      }
    }

    if (currentUser.roleCode === UserRole.DISTRICT_ADMIN) {
      if (citizen.districtId !== currentUser.districtId) {
        throw new ForbiddenException(
          'Siz faqat o\'z tumaningizga tegishli fuqarolar ma\'lumotini tahrirlay olasiz',
        );
      }
    }

    // JSHSHIR unikal ekanligini tekshirish (agar o'zgartirilayotgan bo'lsa)
    if (updateDto.pinfl && updateDto.pinfl !== citizen.pinfl) {
      const existing = await this.citizenRepository.findOne({
        where: { pinfl: updateDto.pinfl },
      });
      if (existing && existing.id !== id) {
        throw new BadRequestException(
          `Ushbu JSHSHIR (${updateDto.pinfl}) allaqachon boshqa fuqaroga (${existing.fullName}) biriktirilgan`,
        );
      }
      citizen.pinfl = updateDto.pinfl;
    }

    // Mahalla o'zgargan bo'lsa
    if (updateDto.mahallaId && updateDto.mahallaId !== citizen.mahallaId) {
      const mahalla = await this.mahallaRepository.findOne({
        where: { id: updateDto.mahallaId },
      });
      if (!mahalla) {
        throw new NotFoundException(`Mahalla topilmadi (ID: ${updateDto.mahallaId})`);
      }
      if (
        currentUser.roleCode === UserRole.DISTRICT_ADMIN &&
        mahalla.districtId !== currentUser.districtId
      ) {
        throw new ForbiddenException(
          'Siz faqat o\'z tumaningizdagi mahallalarni tanlay olasiz',
        );
      }
      citizen.mahallaId = mahalla.id;
      citizen.districtId = mahalla.districtId;
    }

    if (updateDto.fullName !== undefined) citizen.fullName = updateDto.fullName.trim();
    if (updateDto.birthDate !== undefined) {
      const birth = new Date(updateDto.birthDate);
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
          `Fuqaro yoshi ${age} da (voyaga yetmagan bola). Faqat 18 yoshga to'lgan fuqarolar kiritilishi mumkin`,
        );
      }
      if (age > 60) {
        throw new BadRequestException(
          `Fuqaro yoshi ${age} da. Bandlik monitoringi 18 dan 60 yoshgacha bo'lgan fuqarolar uchun o'tkaziladi`,
        );
      }
      citizen.birthDate = birth;
    }
    if (updateDto.phone !== undefined) citizen.phone = updateDto.phone ? updateDto.phone.trim() : undefined;
    if (updateDto.parentPhone !== undefined) citizen.parentPhone = updateDto.parentPhone ? updateDto.parentPhone.trim() : undefined;
    if (updateDto.address !== undefined) citizen.address = updateDto.address.trim();
    if (updateDto.education !== undefined) citizen.education = updateDto.education.trim();
    if (updateDto.specialty !== undefined) citizen.specialty = updateDto.specialty ? updateDto.specialty.trim() : undefined;
    if (updateDto.currentCategory !== undefined) citizen.currentCategory = updateDto.currentCategory;
    if (updateDto.currentStatusDetail !== undefined) citizen.currentStatusDetail = updateDto.currentStatusDetail ? updateDto.currentStatusDetail.trim() : undefined;

    await this.citizenRepository.save(citizen);

    return this.findOne(id, currentUser);
  }

  /**
   * Fuqaroni tizimdan o'chirish (Superadmin, District Admin, Mahalla xodimi)
   */
  async remove(id: string, currentUser: UserEntity) {
    const citizen = await this.citizenRepository.findOne({
      where: { id },
    });

    if (!citizen) {
      throw new NotFoundException(`Fuqaro topilmadi (ID: ${id})`);
    }

    if (
      currentUser.roleCode === UserRole.MAHALLA_OPERATOR &&
      citizen.mahallaId !== currentUser.mahallaId
    ) {
      throw new ForbiddenException(
        'Siz faqat o\'z mahallangizga tegishli fuqarolarni o\'chira olasiz',
      );
    }

    if (
      currentUser.roleCode === UserRole.DISTRICT_ADMIN &&
      citizen.districtId !== currentUser.districtId
    ) {
      throw new ForbiddenException(
        'Siz faqat o\'z tumaningizga tegishli fuqarolarni o\'chira olasiz',
      );
    }

    await this.citizenRepository.remove(citizen);

    return {
      success: true,
      message: 'Fuqaro tizimdan muvaffaqiyatli oʻchirildi',
    };
  }
}
