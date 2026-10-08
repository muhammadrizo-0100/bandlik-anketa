import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CitizenEntity } from '../../database/entities/citizen.entity';
import { SurveyEntity } from '../../database/entities/survey.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { UserEntity } from '../../database/entities/user.entity';
import { DashboardFilterDto } from './dto/dashboard-filter.dto';
import {
  EmploymentCategory,
  SurveyStatus,
  UserRole,
  NoWishReason,
} from '../../database/enums';

interface ScopeFilter {
  districtId?: string;
  mahallaId?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(CitizenEntity)
    private readonly citizenRepository: Repository<CitizenEntity>,
    @InjectRepository(SurveyEntity)
    private readonly surveyRepository: Repository<SurveyEntity>,
    @InjectRepository(MahallaEntity)
    private readonly mahallaRepository: Repository<MahallaEntity>,
  ) {}

  /**
   * Barcha asosiy dashboard ko'rsatkichlarini bitta yagona tezkor API da olish
   */
  async getSummary(filter: DashboardFilterDto, currentUser: UserEntity) {
    const scope = this.resolveScope(filter, currentUser);

    const [
      kpi,
      distribution,
      mahallaStats,
      reasons,
      noWishReasons,
      pendingReviews,
      trendData,
      recentSurveys,
    ] = await Promise.all([
      this.getKpiStats(scope),
      this.getEmploymentDistribution(scope),
      this.getMahallaBreakdown(scope.districtId, scope),
      this.getUnemploymentDirectionsBreakdown(scope),
      this.getNoWishReasonsBreakdown(scope),
      this.getPendingReviewsCount(scope),
      this.getTrendData(scope),
      this.getRecentSurveys(scope),
    ]);

    return {
      kpi,
      distribution,
      mahallaBreakdown: mahallaStats,
      unemploymentDirections: reasons,
      noWishReasons,
      pendingReviewsCount: pendingReviews,
      trendData,
      recentSurveys,
    };
  }

  /**
   * KPI kartalari statistikasi (SQL CASE WHEN orqali bitta tezkor so'rovda)
   */
  async getKpiStats(scope: ScopeFilter) {
    const qb = this.citizenRepository.createQueryBuilder('c');

    if (scope.districtId) {
      qb.andWhere('c.districtId = :districtId', { districtId: scope.districtId });
    }
    if (scope.mahallaId) {
      qb.andWhere('c.mahallaId = :mahallaId', { mahallaId: scope.mahallaId });
    }
    if (scope.startDate) {
      qb.andWhere('c.createdAt >= :startDate', { startDate: new Date(scope.startDate) });
    }
    if (scope.endDate) {
      qb.andWhere('c.createdAt <= :endDate', { endDate: new Date(`${scope.endDate}T23:59:59.999Z`) });
    }

    const raw = await qb
      .select('COUNT(*)', 'total')
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.OFFICIALLY_EMPLOYED}' THEN 1 END)`,
        'officiallyEmployed',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.SELF_EMPLOYED}' THEN 1 END)`,
        'selfEmployed',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.UNOFFICIALLY_EMPLOYED}' THEN 1 END)`,
        'unofficiallyEmployed',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.MIGRANT}' THEN 1 END)`,
        'migrant',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.UNEMPLOYED}' THEN 1 END)`,
        'unemployed',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.NO_WISH_TO_WORK}' THEN 1 END)`,
        'noWishToWork',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.OTHER}' THEN 1 END)`,
        'other',
      )
      .getRawOne();

    const total = parseInt(raw.total || '0', 10);
    const officiallyEmployed = parseInt(raw.officiallyEmployed || '0', 10);
    const selfEmployed = parseInt(raw.selfEmployed || '0', 10);
    const unofficiallyEmployed = parseInt(raw.unofficiallyEmployed || '0', 10);
    const migrant = parseInt(raw.migrant || '0', 10);
    const unemployed = parseInt(raw.unemployed || '0', 10);
    const noWishToWork = parseInt(raw.noWishToWork || '0', 10);
    const other = parseInt(raw.other || '0', 10);

    return {
      totalCitizens: total,
      officiallyEmployed: {
        count: officiallyEmployed,
        percentage: total > 0 ? Number(((officiallyEmployed / total) * 100).toFixed(1)) : 0,
      },
      selfEmployed: {
        count: selfEmployed,
        percentage: total > 0 ? Number(((selfEmployed / total) * 100).toFixed(1)) : 0,
      },
      unofficiallyEmployed: {
        count: unofficiallyEmployed,
        percentage: total > 0 ? Number(((unofficiallyEmployed / total) * 100).toFixed(1)) : 0,
      },
      migrant: {
        count: migrant,
        percentage: total > 0 ? Number(((migrant / total) * 100).toFixed(1)) : 0,
      },
      unemployed: {
        count: unemployed,
        percentage: total > 0 ? Number(((unemployed / total) * 100).toFixed(1)) : 0,
      },
      noWishToWork: {
        count: noWishToWork,
        percentage: total > 0 ? Number(((noWishToWork / total) * 100).toFixed(1)) : 0,
      },
      other: {
        count: other,
        percentage: total > 0 ? Number(((other / total) * 100).toFixed(1)) : 0,
      },
    };
  }

  /**
   * Bandlik toifalari bo'yicha taqsimot (Donut/Pie chart uchun)
   */
  async getEmploymentDistribution(scope: ScopeFilter) {
    const qb = this.citizenRepository.createQueryBuilder('c');

    if (scope.districtId) {
      qb.andWhere('c.districtId = :districtId', { districtId: scope.districtId });
    }
    if (scope.mahallaId) {
      qb.andWhere('c.mahallaId = :mahallaId', { mahallaId: scope.mahallaId });
    }
    if (scope.startDate) {
      qb.andWhere('c.createdAt >= :startDate', { startDate: new Date(scope.startDate) });
    }
    if (scope.endDate) {
      qb.andWhere('c.createdAt <= :endDate', { endDate: new Date(`${scope.endDate}T23:59:59.999Z`) });
    }

    const raw = await qb
      .select('c.currentCategory', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.currentCategory')
      .getRawMany();

    const labelMap: Record<string, string> = {
      [EmploymentCategory.OFFICIALLY_EMPLOYED]: 'Rasmiy band',
      [EmploymentCategory.SELF_EMPLOYED]: 'Oʻzini band qilgan',
      [EmploymentCategory.UNOFFICIALLY_EMPLOYED]: 'Norasmiy band',
      [EmploymentCategory.MIGRANT]: 'Migrant',
      [EmploymentCategory.UNEMPLOYED]: 'Ishsiz yosh',
      [EmploymentCategory.NO_WISH_TO_WORK]: 'Ishlash istagi yo\'q',
      [EmploymentCategory.OTHER]: 'Boshqa holat',
    };

    return raw.map((r) => ({
      category: r.category,
      label: labelMap[r.category] || r.category || 'Aniqlanmagan',
      count: parseInt(r.count, 10),
    }));
  }

  /**
   * Mahallalar kesimida taqqoslama statistika (Bar chart uchun)
   */
  async getMahallaBreakdown(districtId?: string, scope?: ScopeFilter) {
    const qb = this.mahallaRepository
      .createQueryBuilder('m')
      .leftJoin('m.citizens', 'c');

    if (districtId) {
      qb.andWhere('m.districtId = :districtId', { districtId });
    }
    if (scope?.mahallaId) {
      qb.andWhere('m.id = :mahallaId', { mahallaId: scope.mahallaId });
    }
    if (scope?.startDate) {
      qb.andWhere('(c.id IS NULL OR c.createdAt >= :startDate)', { startDate: new Date(scope.startDate) });
    }
    if (scope?.endDate) {
      qb.andWhere('(c.id IS NULL OR c.createdAt <= :endDate)', { endDate: new Date(`${scope.endDate}T23:59:59.999Z`) });
    }

    const raw = await qb
      .select('m.id', 'mahallaId')
      .addSelect('m.name', 'mahallaName')
      .addSelect('COUNT(c.id)', 'total')
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.OFFICIALLY_EMPLOYED}' THEN 1 END)`,
        'official',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.SELF_EMPLOYED}' THEN 1 END)`,
        'selfEmployed',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.UNOFFICIALLY_EMPLOYED}' THEN 1 END)`,
        'unofficial',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.MIGRANT}' THEN 1 END)`,
        'migrant',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.UNEMPLOYED}' THEN 1 END)`,
        'unemployed',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.NO_WISH_TO_WORK}' THEN 1 END)`,
        'noWish',
      )
      .addSelect(
        `COUNT(CASE WHEN c.currentCategory = '${EmploymentCategory.OTHER}' THEN 1 END)`,
        'other',
      )
      .addSelect('MAX(c.updatedAt)', 'lastSurveyAt')
      .groupBy('m.id')
      .addGroupBy('m.name')
      .orderBy('total', 'DESC')
      .limit(10)
      .getRawMany();

    return raw.map((r) => ({
      mahallaId: r.mahallaId,
      mahallaName: r.mahallaName,
      total: parseInt(r.total || '0', 10),
      official: parseInt(r.official || '0', 10),
      selfEmployed: parseInt(r.selfEmployed || '0', 10),
      unofficial: parseInt(r.unofficial || '0', 10),
      migrant: parseInt(r.migrant || '0', 10),
      unemployed: parseInt(r.unemployed || '0', 10),
      noWish: parseInt(r.noWish || '0', 10),
      other: parseInt(r.other || '0', 10),
      lastSurveyAt: r.lastSurveyAt || null,
    }));
  }

  /**
   * Ishsizlar qaysi yo'nalishlarga muhtojligi bo'yicha tahlil (2.4 bandlar)
   */
  async getUnemploymentDirectionsBreakdown(scope: ScopeFilter) {
    const qb = this.surveyRepository
      .createQueryBuilder('s')
      .where('s.mainCategory = :category', { category: EmploymentCategory.UNEMPLOYED })
      .andWhere('s.status = :status', { status: SurveyStatus.APPROVED });

    if (scope.districtId) {
      qb.andWhere('s.districtId = :districtId', { districtId: scope.districtId });
    }
    if (scope.mahallaId) {
      qb.andWhere('s.mahallaId = :mahallaId', { mahallaId: scope.mahallaId });
    }

    const surveys = await qb.select('s.unemployedDirections').getMany();

    const counts: Record<string, number> = {
      PERMANENT_JOB: 0,
      SUBSIDY: 0,
      VOCATIONAL_TRAINING: 0,
      LOAN_BUSINESS: 0,
      ADDITIONAL: 0,
    };

    for (const s of surveys) {
      if (Array.isArray(s.unemployedDirections)) {
        for (const dir of s.unemployedDirections) {
          if (counts[dir] !== undefined) {
            counts[dir]++;
          }
        }
      }
    }

    const labelMap: Record<string, string> = {
      PERMANENT_JOB: 'Doimiy ishga joylashtirish',
      SUBSIDY: 'Subsidiya ajratish',
      VOCATIONAL_TRAINING: 'Kasb-hunarga o\'qitish',
      LOAN_BUSINESS: 'Kredit orqali tadbirkorlik',
      ADDITIONAL: 'Qo\'shimcha yo\'nalish',
    };

    return Object.entries(counts).map(([direction, count]) => ({
      direction,
      label: labelMap[direction] || direction,
      count,
    }));
  }

  /**
   * Ishlash istagi yo'qligi sabablari (2.3 bandlar)
   */
  async getNoWishReasonsBreakdown(scope: ScopeFilter) {
    const qb = this.surveyRepository
      .createQueryBuilder('s')
      .where('s.mainCategory = :category', { category: EmploymentCategory.NO_WISH_TO_WORK })
      .andWhere('s.status = :status', { status: SurveyStatus.APPROVED });

    if (scope.districtId) {
      qb.andWhere('s.districtId = :districtId', { districtId: scope.districtId });
    }
    if (scope.mahallaId) {
      qb.andWhere('s.mahallaId = :mahallaId', { mahallaId: scope.mahallaId });
    }

    const raw = await qb
      .select('s.noWishReason', 'reason')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.noWishReason')
      .getRawMany();

    const labelMap: Record<string, string> = {
      [NoWishReason.CHILD_CARE]: 'Bola tarbiyasida',
      [NoWishReason.HOUSEWIFE]: 'Uy bekasi',
      [NoWishReason.WEALTHY_FAMILY]: 'O\'ziga to\'q oila',
      [NoWishReason.APPLICANT]: 'Abituriyent',
    };

    return raw.map((r) => ({
      reason: r.reason,
      label: labelMap[r.reason] || r.reason || 'Boshqa',
      count: parseInt(r.count, 10),
    }));
  }

  /**
   * Tekshiruv kutayotgan shubhali/ziddiyatli anketalar soni (Review Queue count)
   */
  async getPendingReviewsCount(scope: ScopeFilter): Promise<number> {
    const qb = this.surveyRepository
      .createQueryBuilder('s')
      .where('s.status = :status', { status: SurveyStatus.PENDING_REVIEW });

    if (scope.districtId) {
      qb.andWhere('s.districtId = :districtId', { districtId: scope.districtId });
    }
    if (scope.mahallaId) {
      qb.andWhere('s.mahallaId = :mahallaId', { mahallaId: scope.mahallaId });
    }

    return qb.getCount();
  }

  /**
   * Dinamika grafigi (So'nggi 7 kunlik yoki oylik o'rganishlar trendi)
   */
  async getTrendData(scope: ScopeFilter) {
    const qb = this.surveyRepository.createQueryBuilder('s');

    if (scope.districtId) {
      qb.andWhere('s.districtId = :districtId', { districtId: scope.districtId });
    }
    if (scope.mahallaId) {
      qb.andWhere('s.mahallaId = :mahallaId', { mahallaId: scope.mahallaId });
    }
    if (scope.startDate) {
      qb.andWhere('s.surveyDate >= :startDate', { startDate: scope.startDate });
    }
    if (scope.endDate) {
      qb.andWhere('s.surveyDate <= :endDate', { endDate: scope.endDate });
    }

    const raw = await qb
      .select("TO_CHAR(s.surveyDate, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect(
        `COUNT(CASE WHEN s.mainCategory = '${EmploymentCategory.OFFICIALLY_EMPLOYED}' THEN 1 END)`,
        'official',
      )
      .addSelect(
        `COUNT(CASE WHEN s.mainCategory = '${EmploymentCategory.SELF_EMPLOYED}' THEN 1 END)`,
        'selfEmployed',
      )
      .addSelect(
        `COUNT(CASE WHEN s.mainCategory = '${EmploymentCategory.UNOFFICIALLY_EMPLOYED}' THEN 1 END)`,
        'unofficial',
      )
      .addSelect(
        `COUNT(CASE WHEN s.mainCategory = '${EmploymentCategory.MIGRANT}' THEN 1 END)`,
        'migrant',
      )
      .addSelect(
        `COUNT(CASE WHEN s.mainCategory = '${EmploymentCategory.UNEMPLOYED}' THEN 1 END)`,
        'unemployed',
      )
      .addSelect(
        `COUNT(CASE WHEN s.mainCategory = '${EmploymentCategory.NO_WISH_TO_WORK}' THEN 1 END)`,
        'noWish',
      )
      .groupBy("TO_CHAR(s.surveyDate, 'YYYY-MM-DD')")
      .orderBy('date', 'ASC')
      .limit(14)
      .getRawMany();

    return raw.map((r) => ({
      date: r.date,
      count: parseInt(r.count, 10),
      official: parseInt(r.official || '0', 10),
      selfEmployed: parseInt(r.selfEmployed || '0', 10),
      unofficial: parseInt(r.unofficial || '0', 10),
      migrant: parseInt(r.migrant || '0', 10),
      unemployed: parseInt(r.unemployed || '0', 10),
      noWish: parseInt(r.noWish || '0', 10),
    }));
  }

  /**
   * Dashboarddagi so'nggi 10 ta o'rganilgan fuqarolar
   */
  async getRecentSurveys(scope: ScopeFilter) {
    const qb = this.surveyRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.mahalla', 'm')
      .leftJoinAndSelect('s.operator', 'o');

    if (scope.districtId) {
      qb.andWhere('s.districtId = :districtId', { districtId: scope.districtId });
    }
    if (scope.mahallaId) {
      qb.andWhere('s.mahallaId = :mahallaId', { mahallaId: scope.mahallaId });
    }
    if (scope.startDate) {
      qb.andWhere('s.surveyDate >= :startDate', { startDate: scope.startDate });
    }
    if (scope.endDate) {
      qb.andWhere('s.surveyDate <= :endDate', { endDate: scope.endDate });
    }

    return qb
      .orderBy('s.createdAt', 'DESC')
      .limit(50)
      .getMany();
  }

  /**
   * Foydalanuvchi roliga qarab tuman va mahalla scope'ini qat'iy belgilash
   */
  private resolveScope(filter: DashboardFilterDto, currentUser: UserEntity): ScopeFilter {
    let districtId = filter.districtId;
    let mahallaId = filter.mahallaId;

    if (currentUser.roleCode === UserRole.MAHALLA_OPERATOR) {
      districtId = currentUser.districtId;
      mahallaId = currentUser.mahallaId;
    } else if (currentUser.roleCode === UserRole.DISTRICT_ADMIN) {
      districtId = currentUser.districtId;
      mahallaId = filter.mahallaId || undefined;
    }

    return {
      districtId: districtId || undefined,
      mahallaId: mahallaId || undefined,
      startDate: filter.startDate || undefined,
      endDate: filter.endDate || undefined,
    };
  }
}
