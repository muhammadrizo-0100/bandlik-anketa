import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CitizensService } from './citizens.service';
import { FilterCitizenDto } from './dto/filter-citizen.dto';
import { UpdateCitizenDto } from './dto/update-citizen.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';
import { UserRole } from '../../database/enums';

@ApiTags('Citizens')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('citizens')
export class CitizensController {
  constructor(private readonly citizensService: CitizensService) {}

  @Get()
  @ApiOperation({
    summary: 'Fuqarolar ro\'yxatini olish (Mahalla operatori faqat o\'z mahallasini ko\'radi)',
  })
  findAll(
    @Query() filterDto: FilterCitizenDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.citizensService.findAll(filterDto, user);
  }

  @Get('check-pinfl/:pinfl')
  @ApiOperation({
    summary: 'JSHSHIR bo\'yicha fuqaroni tekshirish (Forma to\'ldirishda dublikatni tekshirish uchun)',
  })
  checkPinfl(
    @Param('pinfl') pinfl: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.citizensService.findByPinfl(pinfl, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Fuqaroning to\'liq profili, anketalari va bandlik tarixi',
  })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.citizensService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN, UserRole.MAHALLA_OPERATOR)
  @ApiOperation({
    summary: 'Fuqaro ma\'lumotlarini to\'liq tahrirlash (Superadmin, District Admin, Mahalla xodimi)',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateCitizenDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.citizensService.update(id, updateDto, user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN, UserRole.MAHALLA_OPERATOR)
  @ApiOperation({
    summary: 'Fuqaroni tizimdan o\'chirish (Superadmin, District Admin, Mahalla xodimi)',
  })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: UserEntity,
  ) {
    return this.citizensService.remove(id, user);
  }
}
