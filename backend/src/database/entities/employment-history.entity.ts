import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { CitizenEntity } from './citizen.entity';
import { SurveyEntity } from './survey.entity';
import { UserEntity } from './user.entity';
import { EmploymentCategory, DataSource } from '../enums';

@Entity('employment_history')
export class EmploymentHistoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Qaysi fuqaroning bandlik tarixi
  @Index()
  @ManyToOne(() => CitizenEntity, (citizen) => citizen.employmentHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'citizen_id' })
  citizen: CitizenEntity;

  @Column({ name: 'citizen_id' })
  citizenId: string;

  // O'zgarishga asos bo'lgan so'rovnoma (mavjud bo'lsa)
  @ManyToOne(() => SurveyEntity, (survey) => survey.employmentHistories, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'survey_id' })
  survey?: SurveyEntity;

  @Column({ name: 'survey_id', nullable: true })
  surveyId?: string;

  // Avvalgi bandlik kategoriyasi
  @Column({
    type: 'enum',
    enum: EmploymentCategory,
    nullable: true,
  })
  previousCategory?: EmploymentCategory;

  // Avvalgi to'liq ma'lumotlar snapshot'i (ish joyi, sabab va h.k.)
  @Column({ type: 'jsonb', nullable: true })
  previousDetails?: Record<string, any>;

  // Yangi bandlik kategoriyasi
  @Column({
    type: 'enum',
    enum: EmploymentCategory,
  })
  newCategory: EmploymentCategory;

  // Yangi to'liq ma'lumotlar snapshot'i
  @Column({ type: 'jsonb', nullable: true })
  newDetails: Record<string, any>;

  // O'zgarishni kiritgan xodim (Operator, Reviewer, Admin)
  @ManyToOne(() => UserEntity, (user) => user.historyCreated, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'changed_by_id' })
  changedBy: UserEntity;

  @Column({ name: 'changed_by_id' })
  changedById: string;

  // O'zgartirish sababi / izoh
  @Column({ type: 'text', nullable: true })
  changeReason?: string;

  // O'zgarish manbasi (Yetakchi so'rovnomasi, Soliq integratsiyasi, Auditor tekshiruvi)
  @Column({
    type: 'enum',
    enum: DataSource,
    default: DataSource.SURVEY_OPERATOR,
  })
  dataSource: DataSource;

  @CreateDateColumn()
  createdAt: Date;
}
