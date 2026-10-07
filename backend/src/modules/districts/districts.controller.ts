import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DistrictsService } from './districts.service';
import { CreateDistrictDto } from './dto/create-district.dto';
import { UpdateDistrictDto } from './dto/update-district.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UserRole } from '../../database/enums';

@ApiTags('Districts (Tumanlar)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN, UserRole.DATA_REVIEWER)
  @ApiOperation({ summary: 'Barcha tumanlar ro\'yxati' })
  findAll() {
    return this.districtsService.findAll();
  }

  @Public()
  @Get('dropdown')
  @ApiOperation({ summary: 'Tumanlar selektori uchun yengil ro\'yxat' })
  getDropdown() {
    return this.districtsService.getDropdown();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Alohida tumanni ko\'rish' })
  findOne(@Param('id') id: string) {
    return this.districtsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Yangi tuman qo\'shish (Faqat Super Admin)' })
  create(@Body() dto: CreateDistrictDto) {
    return this.districtsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tumanni tahrirlash (Faqat Super Admin)' })
  update(@Param('id') id: string, @Body() dto: UpdateDistrictDto) {
    return this.districtsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tumanni o\'chirish (Faqat Super Admin)' })
  remove(@Param('id') id: string) {
    return this.districtsService.remove(id);
  }
}
