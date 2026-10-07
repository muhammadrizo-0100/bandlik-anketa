import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../database/enums';
import { UserEntity } from '../../database/entities/user.entity';

@ApiTags('Dashboard & Statistika')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.MAHALLA_OPERATOR,
    UserRole.DATA_REVIEWER,
  )
  @ApiOperation({ summary: 'Yagona asosiy dashboard statistikasi (KPI, grafiklar, sabablar)' })
  getSummary(
    @Query() filter: DashboardFilterDto,
    @CurrentUser() user: UserEntity,
  ) {
    return this.dashboardService.getSummary(filter, user);
  }

  @Get('kpi')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.MAHALLA_OPERATOR,
    UserRole.DATA_REVIEWER,
  )
  @ApiOperation({ summary: 'Asosiy KPI kartalari (Jami, Rasmiy, Norasmiy, Ishsiz, Istagi yo\'q)' })
  getKpi(
    @Query() filter: DashboardFilterDto,
    @CurrentUser() user: UserEntity,
  ) {
    const scope = this.resolveScope(filter, user);
    return this.dashboardService.getKpiStats(scope);
  }

  @Get('distribution')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.MAHALLA_OPERATOR,
    UserRole.DATA_REVIEWER,
  )
  @ApiOperation({ summary: 'Bandlik toifalari taqsimoti' })
  getDistribution(
    @Query() filter: DashboardFilterDto,
    @CurrentUser() user: UserEntity,
  ) {
    const scope = this.resolveScope(filter, user);
    return this.dashboardService.getEmploymentDistribution(scope);
  }

  @Get('mahallas')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.DATA_REVIEWER,
  )
  @ApiOperation({ summary: 'Mahalla kesimidagi ko\'rsatkichlar jadvali' })
  getMahallaBreakdown(
    @Query() filter: DashboardFilterDto,
    @CurrentUser() user: UserEntity,
  ) {
    const targetDistrictId =
      user.roleCode === UserRole.DISTRICT_ADMIN
        ? user.districtId
        : filter.districtId;
    return this.dashboardService.getMahallaBreakdown(targetDistrictId);
  }

  @Get('unemployment-directions')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.MAHALLA_OPERATOR,
    UserRole.DATA_REVIEWER,
  )
  @ApiOperation({ summary: '2.4. Ishsiz yoshlar talab qilayotgan yo\'nalishlar statistikasi' })
  getUnemploymentDirections(
    @Query() filter: DashboardFilterDto,
    @CurrentUser() user: UserEntity,
  ) {
    const scope = this.resolveScope(filter, user);
    return this.dashboardService.getUnemploymentDirectionsBreakdown(scope);
  }

  @Get('no-wish-reasons')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.DISTRICT_ADMIN,
    UserRole.MAHALLA_OPERATOR,
    UserRole.DATA_REVIEWER,
  )
  @ApiOperation({ summary: '2.3. Ishlash istagi yo\'qligi sabablari statistikasi' })
  getNoWishReasons(
    @Query() filter: DashboardFilterDto,
    @CurrentUser() user: UserEntity,
  ) {
    const scope = this.resolveScope(filter, user);
    return this.dashboardService.getNoWishReasonsBreakdown(scope);
  }

  private resolveScope(filter: DashboardFilterDto, user: UserEntity) {
    if (user.roleCode === UserRole.MAHALLA_OPERATOR) {
      return {
        districtId: user.districtId,
        mahallaId: user.mahallaId,
      };
    }
    if (user.roleCode === UserRole.DISTRICT_ADMIN) {
      return {
        districtId: user.districtId,
        mahallaId: filter.mahallaId,
      };
    }
    return {
      districtId: filter.districtId,
      mahallaId: filter.mahallaId,
    };
  }
}
