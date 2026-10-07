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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Yangi xodim yaratish (Super Admin yoki Tuman Admini)' })
  create(@Body() createUserDto: CreateUserDto, @CurrentUser() currentUser: UserEntity) {
    // Agar Tuman Admini yaratsa, faqat o'z tumaniga xodim yarata oladi (Tuman Boshlig'i yoki Mahalla Operatori)
    if (currentUser.roleCode === UserRole.DISTRICT_ADMIN) {
      if (
        createUserDto.role &&
        createUserDto.role !== UserRole.MAHALLA_OPERATOR &&
        createUserDto.role !== UserRole.DISTRICT_ADMIN
      ) {
        throw new ForbiddenException(
          'Tuman administratori faqat Tuman Boshligʻi yoki Mahalla yetakchilarini yarata oladi',
        );
      }
      createUserDto.districtId = currentUser.districtId;
    }
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Barcha xodimlar ro\'yxati (Super Admin va Tuman Admini)' })
  findAll(
    @Query() filterDto: FilterUserDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    const filters: any = { ...filterDto };
    if (currentUser.roleCode === UserRole.DISTRICT_ADMIN && currentUser.districtId) {
      filters.districtId = currentUser.districtId;
    }
    return this.usersService.findAll(filters);
  }

  @Get('profile/me')
  @ApiOperation({ summary: 'Joriy xodim ma\'lumotlarini olish' })
  async getProfile(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.roleCode || user.role?.code,
      roleCode: user.roleCode || user.role?.code,
      roleName: user.role?.name || user.roleCode,
      districtId: user.districtId,
      districtName: user.district?.name,
      mahallaId: user.mahallaId,
      mahallaName: user.mahalla?.name,
      isActive: user.isActive,
    };
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'ID bo\'yicha xodim ma\'lumoti' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.DISTRICT_ADMIN)
  @ApiOperation({ summary: 'Xodim ma\'lumotlarini yangilash' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: UserEntity,
  ) {
    if (currentUser.roleCode !== UserRole.SUPER_ADMIN) {
      if (updateUserDto.password || updateUserDto.username) {
        throw new ForbiddenException(
          'Faqat Bosh Administrator (Super Admin) login va parolni oʻzgartira oladi',
        );
      }
    }
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Xodimni o\'chirish (Faqat Super Admin)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
