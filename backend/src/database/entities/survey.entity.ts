import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { CitizenEntity } from './citizen.entity';
import { UserEntity } from './user.entity';
import { DistrictEntity } from './district.entity';
import { MahallaEntity } from './mahalla.entity';
import { EmploymentHistoryEntity } from './employment-history.entity';
import {
  SurveyMethod,
  EmploymentCategory,
  NoWishReason,
  UnemployedDirection,
  SurveyStatus,
  DataSource,
  TaxVerificationStatus,
} from '../enums';

@Entity('surveys')
export class SurveyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Fuqaroga bog'lanish (Reviewdagi yangi kiritilgan holatlarda vaqtincha bo'lishi mumkin)
  @ManyToOne(() => CitizenEntity, (citizen) => citizen.surveys, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'citizen_id' })
  citizen?: CitizenEntity;

  @Column({ name: 'citizen_id', nullable: true })
  citizenId?: string;

  // JSHSHIR (Tezkor tekshirish va ziddiyatlarni aniqlash uchun)
  @Index()
  @Column({ length: 14 })
  citizenPinfl: string;

  @Column({ length: 150 })
  citizenFullName: string;

  // So'rovnomani to'ldirgan Mahalla yetakchisi / operatori
  @ManyToOne(() => UserEntity, (user) => user.surveysConducted, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'operator_id' })
  operator: UserEntity;

  @Column({ name: 'operator_id' })
  operatorId: string;

  // Mahalla
  @ManyToOne(() => MahallaEntity, (mahalla) => mahalla.surveys, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'mahalla_id' })
  mahalla: MahallaEntity;

  @Column({ name: 'mahalla_id' })
  mahallaId: string;

  // Tuman
  @ManyToOne(() => DistrictEntity, (district) => district.surveys, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'district_id' })
  district: DistrictEntity;

  @Column({ name: 'district_id' })
  districtId: string;

  // So'rovnoma o'tkazilgan sana
  @Column({ type: 'date' })
  surveyDate: Date;

  // O'rganish shakli: Uyma-uy, Telefon, Qabulda
  @Column({
    type: 'enum',
    enum: SurveyMethod,
    default: SurveyMethod.HOME_VISIT,
  })
  surveyMethod: SurveyMethod;

  // ==========================================
  // II. BANDLIK HOLATI (2.1 - 2.5 ASOSIY KATEGORIYA)
  // ==========================================
  @Column({
    type: 'enum',
    enum: EmploymentCategory,
  })
  mainCategory: EmploymentCategory;

  // 2.1. Rasmiy band bo'lsa -> Ish joyi va lavozimi
  @Column({ type: 'varchar', length: 255, nullable: true })
  officialWorkplace?: string;

  // 2.2. O'zini o'zi band qilgan bo'lsa -> Faoliyat turi va soliq ro'yxati
  @Column({ type: 'varchar', length: 255, nullable: true })
  selfEmployedActivity?: string;

  @Column({ type: 'boolean', default: false })
  selfEmployedRegistered?: boolean;

  // 2.3. Norasmiy band bo'lsa -> Faoliyat turi
  @Column({ type: 'varchar', length: 255, nullable: true })
  unofficialActivityType?: string;

  // 2.4. Migrant bo'lsa -> Qaysi davlat va muddati
  @Column({ type: 'varchar', length: 150, nullable: true })
  migrantCountry?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  migrantDuration?: string;

  // 2.3. Ishlash istagi yo'q bo'lsa -> Sababi (Bola tarbiyasida, Uy bekasi, O'ziga to'q, Abituriyent)
  @Column({
    type: 'enum',
    enum: NoWishReason,
    nullable: true,
  })
  noWishReason?: NoWishReason;

  // 2.4. Ishsiz yosh bo'lsa -> Talab qilinadigan yo'nalishlar (Array: Doimiy ish, Subsidiya, Kasb-hunar, Kredit, Qo'shimcha)
  @Column({
    type: 'text',
    array: true,
    nullable: true,
  })
  unemployedDirections?: UnemployedDirection[];

  // 2.4. Ishsiz yosh bo'lsa -> Qo'shimcha yo'nalish izohi
  @Column({ type: 'text', nullable: true })
  unemployedAdditionalNote?: string;

  // 2.5. Boshqa bo'lsa -> Izoh
  @Column({ type: 'text', nullable: true })
  otherReasonNote?: string;

  // ==========================================
  // IMZOLAR VA TASDIQ
  // ==========================================
  @Column({ default: true })
  citizenSigned: boolean;

  @Column({ default: true })
  operatorSigned: boolean;

  // ==========================================
  // DATA REVIEWER & CONFLICT QUEUE (Ziddiyatlar)
  // ==========================================
  @Column({
    type: 'enum',
    enum: SurveyStatus,
    default: SurveyStatus.APPROVED,
  })
  status: SurveyStatus;

  // Ziddiyat sababi (masalan: "JSHSHIR dublikati aniqlandi")
  @Column({ type: 'text', nullable: true })
  conflictReason?: string;

  // Tekshiruvchi xodim
  @ManyToOne(() => UserEntity, (user) => user.reviewedSurveys, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer?: UserEntity;

  @Column({ name: 'reviewer_id', nullable: true })
  reviewerId?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', nullable: true })
  reviewerNote?: string;

  // ==========================================
  // KELAJAKDAGI SOLIQ INTEGRATSIYASI UCHUN ZAMIN
  // ==========================================
  @Column({
    type: 'enum',
    enum: DataSource,
    default: DataSource.SURVEY_OPERATOR,
  })
  dataSource: DataSource;

  @Column({ length: 100, nullable: true })
  externalReferenceId?: string;

  @Column({
    type: 'enum',
    enum: TaxVerificationStatus,
    default: TaxVerificationStatus.NOT_VERIFIED,
  })
  taxVerificationStatus: TaxVerificationStatus;

  @Column({ type: 'timestamp', nullable: true })
  taxVerificationDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  taxDataSnapshot?: Record<string, any>;

  // So'rovnoma oqibatida yaratilgan bandlik tarixi
  @OneToMany(() => EmploymentHistoryEntity, (history) => history.survey)
  employmentHistories: EmploymentHistoryEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
