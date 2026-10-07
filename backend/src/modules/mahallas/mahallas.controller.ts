import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MahallasService } from './mahallas.service';
import { CreateMahallaDto } from './dto/create-mahalla.dto';
import { UpdateMahallaDto } from './dto/update-mahalla.dto';
import { FilterMahallaDto } from './dto/filter-mahalla.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../database/enums';
import { UserEntity } from '../../database/entities/user.entity';

@ApiTags('Mahallas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mahallas')
export class MahallasController {
  constructor(private readonly mahallasService: MahallasService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Yangi mahalla qo\'shish (Super Admin yoki District Admin)' })
  create(@Body() createDto: CreateMahallaDto, @CurrentUser() user: UserEntity) {
    if (user.roleCode === UserRole.DISTRICT_ADMIN && user.districtId) {
      createDto.districtId = user.districtId;
    }
    return this.mahallasService.create(createDto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.MAHALLA_OPERATOR,
    UserRole.DATA_REVIEWER,
  )
  @ApiOperation({ summary: 'Mahallalar ro\'yxati (Qidiruv va statistika bilan)' })
  findAll(
    @Query() filterDto: FilterMahallaDto,
    @CurrentUser() user: UserEntity,
  ) {
    const filters: any = { ...filterDto };
    if (user.roleCode === UserRole.DISTRICT_ADMIN && user.districtId) {
      filters.districtId = user.districtId;
    }
    return this.mahallasService.findAll(filters);
  }

  @Public()
  @Get('dropdown')
  @ApiOperation({ summary: 'Dropdown tanlovlar uchun qisqa mahallalar ro\'yxati' })
  getDropdown(
    @Query('districtId') districtId?: string,
    @CurrentUser() user?: UserEntity,
  ) {
    let targetDistrictId = districtId;
    if (user && user.roleCode === UserRole.DISTRICT_ADMIN && user.districtId) {
      targetDistrictId = user.districtId;
    }
    return this.mahallasService.getDropdownList(targetDistrictId);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.DATA_REVIEWER,
  )
  @ApiOperation({ summary: 'Mahalla haqida to\'liq ma\'lumot va biriktirilgan operatorlar' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.mahallasService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Mahalla ma\'lumotlarini tahrirlash' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateMahallaDto,
  ) {
    return this.mahallasService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mahallani tizimdan o\'chirish (Faqat Super Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.mahallasService.remove(id);
  }
}
