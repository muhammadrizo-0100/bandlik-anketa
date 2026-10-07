import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums';
import { NAMANGAN_MAHALLAS } from '../../database/namangan-data.js';
import { CreateMahallaDto } from './dto/create-mahalla.dto';
import { UpdateMahallaDto } from './dto/update-mahalla.dto';
import { FilterMahallaDto } from './dto/filter-mahalla.dto';

@Injectable()
export class MahallasService {
  constructor(
    @InjectRepository(MahallaEntity)
    private readonly mahallaRepository: Repository<MahallaEntity>,
  ) {}

  /**
   * Yangi mahalla qo'shish (Super Admin yoki District Admin)
   */
  async create(createDto: CreateMahallaDto): Promise<MahallaEntity> {
    const existing = await this.mahallaRepository.findOne({
      where: {
        name: createDto.name,
        districtId: createDto.districtId,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Ushbu tumanda "${createDto.name}" nomli mahalla allaqachon mavjud`,
      );
    }

    const mahalla = this.mahallaRepository.create({
      name: createDto.name,
      districtId: createDto.districtId,
      code: createDto.code,
      region: createDto.region || 'Namangan viloyati',
    });

    return this.mahallaRepository.save(mahalla);
  }

  /**
   * Barcha mahallalar ro'yxati (Qidiruv, filter va pagination bilan)
   */
  async findAll(filterDto: FilterMahallaDto & { districtId?: string }) {
    const { search, district, districtId, page = 1, limit = 50 } = filterDto;
    const skip = ((page || 1) - 1) * (limit || 50);

    const queryBuilder = this.mahallaRepository
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.district', 'district')
      .leftJoinAndSelect('m.operators', 'operators')
      .leftJoinAndSelect('operators.role', 'role');

    if (search) {
      queryBuilder.andWhere('LOWER(m.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    if (districtId) {
      queryBuilder.andWhere('m.districtId = :districtId', { districtId });
    } else if (district) {
      queryBuilder.andWhere('LOWER(district.name) LIKE LOWER(:district)', {
        district: `%${district}%`,
      });
    }

    queryBuilder
      .orderBy('m.name', 'ASC')
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
   * Barcha mahallalar ro'yxati (Dropdownlar uchun qisqa ro'yxat)
   */
  async getDropdownList(districtId?: string) {
    const where: any = {};
    if (districtId) {
      where.districtId = districtId;
    }

    let items = await this.mahallaRepository.find({
      where,
      select: {
        id: true,
        name: true,
        districtId: true,
      },
      relations: { district: true },
      order: { name: 'ASC' },
    });

    if (districtId && items.length < 5) {
      await this.ensureMahallasForDistrict(districtId);
      items = await this.mahallaRepository.find({
        where,
        select: {
          id: true,
          name: true,
          districtId: true,
        },
        relations: { district: true },
        order: { name: 'ASC' },
      });
    }

    try {
      const userRepo = this.mahallaRepository.manager.getRepository(UserEntity);
      const operators = await userRepo.find({
        where: { roleCode: UserRole.MAHALLA_OPERATOR, isActive: true },
        select: { id: true, fullName: true, username: true, mahallaId: true },
      });
      const opMap = new Map<string, { id: string; fullName: string; username: string }>();
      for (const op of operators) {
        if (op.mahallaId) {
          opMap.set(op.mahallaId, { id: op.id, fullName: op.fullName, username: op.username });
        }
      }

      return items.map((m) => ({
        ...m,
        assignedOperator: opMap.get(m.id) || null,
      }));
    } catch {
      return items.map((m) => ({ ...m, assignedOperator: null }));
    }
  }

  private async ensureMahallasForDistrict(districtId: string) {
    try {
      const distRepo = this.mahallaRepository.manager.getRepository(DistrictEntity);
      const district = await distRepo.findOne({ where: { id: districtId } });
      if (!district) return;

      const mahallasList = NAMANGAN_MAHALLAS[district.name] || [];

      for (const mName of mahallasList) {
        const exists = await this.mahallaRepository.findOne({
          where: { name: mName, districtId: district.id },
        });
        if (!exists) {
          const entity = this.mahallaRepository.create({
            name: mName,
            district,
            districtId: district.id,
            region: 'Namangan viloyati',
          });
          await this.mahallaRepository.save(entity);
        }
      }
    } catch (e) {
      // safely ignore
    }
  }

  /**
   * Bitta mahallani ID bo'yicha olish (operatorlari bilan birga)
   */
  async findOne(id: string): Promise<MahallaEntity> {
    const mahalla = await this.mahallaRepository.findOne({
      where: { id },
      relations: {
        district: true,
        operators: {
          role: true,
        },
      },
    });

    if (!mahalla) {
      throw new NotFoundException(`Mahalla topilmadi (ID: ${id})`);
    }

    return mahalla;
  }

  /**
   * Mahalla ma'lumotlarini yangilash
   */
  async update(id: string, updateDto: UpdateMahallaDto): Promise<MahallaEntity> {
    const mahalla = await this.findOne(id);
    Object.assign(mahalla, updateDto);
    return this.mahallaRepository.save(mahalla);
  }

  /**
   * Mahallani o'chirish
   */
  async remove(id: string): Promise<void> {
    const mahalla = await this.findOne(id);
    await this.mahallaRepository.remove(mahalla);
  }
}
