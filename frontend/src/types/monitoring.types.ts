import { User } from './auth.types';

export type SurveyMethod = 'HOME_VISIT' | 'PHONE' | 'IN_PERSON';

export type EmploymentCategory =
  | 'OFFICIALLY_EMPLOYED'
  | 'SELF_EMPLOYED'
  | 'UNOFFICIALLY_EMPLOYED'
  | 'MIGRANT'
  | 'NO_WISH_TO_WORK'
  | 'UNEMPLOYED'
  | 'OTHER';

export type NoWishReason =
  | 'CHILD_CARE'
  | 'HOUSEWIFE'
  | 'WEALTHY_FAMILY'
  | 'APPLICANT';

export type UnemployedDirection =
  | 'PERMANENT_JOB'
  | 'SUBSIDY'
  | 'VOCATIONAL_TRAINING'
  | 'LOAN_BUSINESS'
  | 'ADDITIONAL';

export type SurveyStatus = 'APPROVED' | 'PENDING_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface District {
  id: string;
  name: string;
  region: string;
  code?: string;
  isActive?: boolean;
  mahallas?: Mahalla[];
  assignedAdmin?: { id: string; fullName: string; username: string } | null;
}

export interface Mahalla {
  id: string;
  name: string;
  districtId?: string;
  district?: string | District;
  region: string;
  code?: string;
  operatorsCount?: number;
  citizensCount?: number;
  surveysCount?: number;
  assignedOperator?: { id: string; fullName: string; username: string } | null;
}

export interface Citizen {
  id: string;
  fullName: string;
  birthDate: string;
  pinfl: string;
  phone?: string;
  parentPhone?: string;
  address: string;
  education: string;
  specialty?: string;
  mahallaId: string;
  mahalla?: Mahalla;
  district: string;
  currentCategory?: EmploymentCategory;
  currentStatusDetail?: string;
  createdAt: string;
  updatedAt: string;
  surveys?: Survey[];
  employmentHistory?: EmploymentHistory[];
}

export interface Survey {
  id: string;
  citizenId?: string;
  citizen?: Citizen;
  citizenPinfl: string;
  citizenFullName: string;
  operatorId: string;
  operator?: User;
  mahallaId: string;
  mahalla?: Mahalla;
  district: string;
  surveyDate: string;
  surveyMethod: SurveyMethod;
  mainCategory: EmploymentCategory;
  officialWorkplace?: string;
  selfEmployedActivity?: string;
  selfEmployedRegistered?: boolean;
  unofficialActivityType?: string;
  migrantCountry?: string;
  migrantDuration?: string;
  noWishReason?: NoWishReason;
  unemployedDirections?: UnemployedDirection[];
  unemployedAdditionalNote?: string;
  otherReasonNote?: string;
  citizenSigned: boolean;
  operatorSigned: boolean;
  status: SurveyStatus;
  conflictReason?: string;
  reviewerId?: string;
  reviewer?: User;
  reviewedAt?: string;
  reviewerNote?: string;
  createdAt: string;
}

export interface EmploymentHistory {
  id: string;
  citizenId: string;
  surveyId?: string;
  previousCategory?: EmploymentCategory;
  previousDetails?: Record<string, any>;
  newCategory: EmploymentCategory;
  newDetails: Record<string, any>;
  changedById: string;
  changedBy?: User;
  changeReason?: string;
  dataSource: string;
  createdAt: string;
}

export interface CreateSurveyInput {
  districtId?: string;
  mahallaId?: string;
  customMahallaName?: string;
  surveyMethod: SurveyMethod;
  surveyDate: string;
  fullName: string;
  birthDate: string;
  pinfl: string;
  address: string;
  education: string;
  phone?: string;
  parentPhone?: string;
  specialty?: string;
  mainCategory: EmploymentCategory;
  officialWorkplace?: string;
  selfEmployedActivity?: string;
  selfEmployedRegistered?: boolean;
  unofficialActivityType?: string;
  migrantCountry?: string;
  migrantDuration?: string;
  noWishReason?: NoWishReason;
  unemployedDirections?: UnemployedDirection[];
  unemployedAdditionalNote?: string;
  otherReasonNote?: string;
  citizenSigned?: boolean;
  operatorSigned?: boolean;
}

export interface KpiCardStat {
  count: number;
  percentage: number;
}

export interface KpiData {
  totalCitizens: number;
  officiallyEmployed: KpiCardStat;
  selfEmployed?: KpiCardStat;
  unofficiallyEmployed: KpiCardStat;
  migrant?: KpiCardStat;
  unemployed: KpiCardStat;
  noWishToWork: KpiCardStat;
  other: KpiCardStat;
}

export interface EmploymentDistributionItem {
  category: EmploymentCategory;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface MahallaStatItem {
  id: string;
  name: string;
  district: string;
  total: number;
  official?: number;
  officiallyEmployed?: number;
  selfEmployed?: number;
  unofficial?: number;
  unofficiallyEmployed?: number;
  migrant?: number;
  unemployed: number;
  noWish?: number;
  noWishToWork?: number;
  other: number;
  employmentRate?: number;
}

export interface DirectionStatItem {
  direction: string;
  label: string;
  count: number;
  percentage: number;
}

export interface NoWishReasonStatItem {
  reason: string;
  label: string;
  count: number;
  percentage: number;
}

export interface DashboardSummary {
  kpi: {
    totalCitizens: number;
    officiallyEmployed: KpiCardStat;
    selfEmployed?: KpiCardStat;
    unofficiallyEmployed: KpiCardStat;
    migrant?: KpiCardStat;
    unemployed: KpiCardStat;
    noWishToWork: KpiCardStat;
    other: KpiCardStat;
  };
  distribution: EmploymentDistributionItem[];
  mahallaBreakdown: MahallaStatItem[];
  unemploymentDirections: DirectionStatItem[];
  noWishReasons: NoWishReasonStatItem[];
  pendingReviewsCount: number;
  trendData?: Array<{ date: string; count: number }>;
  recentSurveys?: Survey[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
