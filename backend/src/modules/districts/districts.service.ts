import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DistrictEntity } from '../../database/entities/district.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';

import { NAMANGAN_DISTRICTS } from '../../database/namangan-data.js';

@Injectable()
export class DistrictsService {
  constructor(
    @InjectRepository(DistrictEntity)
    private readonly districtRepo: Repository<DistrictEntity>,
  ) {}

  async findAll() {
    return this.districtRepo.find({
      order: { name: 'ASC' },
      relations: { mahallas: true },
    });
  }

  async getDropdown() {
    let list = await this.districtRepo.find({
      where: { isActive: true },
      select: { id: true, name: true, code: true, region: true },
      order: { name: 'ASC' },
    });

    if (list.length < NAMANGAN_DISTRICTS.length) {
      await this.ensureAllDistricts();
      list = await this.districtRepo.find({
        where: { isActive: true },
        select: { id: true, name: true, code: true, region: true },
        order: { name: 'ASC' },
      });
    }

    try {
      const userRepo = this.districtRepo.manager.getRepository(UserEntity);
      const admins = await userRepo.find({
        where: { roleCode: UserRole.DISTRICT_ADMIN, isActive: true },
        select: { id: true, fullName: true, username: true, districtId: true },
      });
      const adminMap = new Map<string, { id: string; fullName: string; username: string }>();
      for (const a of admins) {
        if (a.districtId) {
          adminMap.set(a.districtId, { id: a.id, fullName: a.fullName, username: a.username });
        }
      }

      return list.map((d) => ({
        ...d,
        assignedAdmin: adminMap.get(d.id) || null,
      }));
    } catch {
      return list.map((d) => ({ ...d, assignedAdmin: null }));
    }
  }

  private async ensureAllDistricts() {
    for (const item of NAMANGAN_DISTRICTS) {
      try {
        const existing = await this.districtRepo.findOne({
          where: [
            { name: item.name },
            { code: item.code },
            { name: item.name.replace(' tumani', '') }
          ],
        });

        if (!existing) {
          const district = this.districtRepo.create({
            name: item.name,
            region: 'Namangan viloyati',
            code: item.code,
            isActive: true,
          });
          await this.districtRepo.save(district);
        } else if (existing.name !== item.name) {
          existing.name = item.name;
          await this.districtRepo.save(existing);
        }
      } catch (err) {
        // ignore unique constraint collisions safely
      }
    }
  }

  async findOne(id: string) {
    const district = await this.districtRepo.findOne({
      where: { id },
      relations: { mahallas: true },
    });
    if (!district) {
      throw new NotFoundException(`Tuman topilmadi: ${id}`);
    }
    return district;
  }

  async create(dto: CreateDistrictDto) {
    const exists = await this.districtRepo.findOne({
      where: { name: dto.name },
    });
    if (exists) {
      throw new ConflictException(`Bu nomdagi tuman allaqachon mavjud: ${dto.name}`);
    }

    const district = this.districtRepo.create(dto);
    return this.districtRepo.save(district);
  }

  async update(id: string, dto: UpdateDistrictDto) {
    const district = await this.findOne(id);
    Object.assign(district, dto);
    return this.districtRepo.save(district);
  }

  async remove(id: string) {
    const district = await this.findOne(id);
    return this.districtRepo.remove(district);
  }
}
