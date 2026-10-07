import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole } from '../enums';
import { RoleEntity } from './role.entity';
import { DistrictEntity } from './district.entity';
import { MahallaEntity } from './mahalla.entity';
import { SurveyEntity } from './survey.entity';
import { EmploymentHistoryEntity } from './employment-history.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  username: string;

  @Column({ unique: true, length: 150, nullable: true })
  email?: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column({ length: 150 })
  fullName: string;

  @Column({ length: 30, nullable: true })
  phone?: string;

  // Foydalanuvchi roli (RBAC)
  @ManyToOne(() => RoleEntity, (role) => role.users, { eager: true })
  @JoinColumn({ name: 'role_id' })
  role: RoleEntity;

  @Column({ name: 'role_id' })
  roleId: number;

  @Column({
    type: 'enum',
    enum: UserRole,
  })
  roleCode: UserRole;

  // Foydalanuvchi biriktirilgan tuman (District Admin va Mahalla Operator uchun)
  @ManyToOne(() => DistrictEntity, (district) => district.users, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'district_id' })
  district?: DistrictEntity;

  @Column({ name: 'district_id', nullable: true })
  districtId?: string;

  // Faqat Mahalla Operator uchun biriktirilgan mahalla (boshqalar uchun null)
  @ManyToOne(() => MahallaEntity, (mahalla) => mahalla.operators, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'mahalla_id' })
  mahalla?: MahallaEntity;

  @Column({ name: 'mahalla_id', nullable: true })
  mahallaId?: string;

  @Column({ default: true })
  isActive: boolean;

  // Yetakchi tomonidan o'tkazilgan so'rovnomalar
  @OneToMany(() => SurveyEntity, (survey) => survey.operator)
  surveysConducted: SurveyEntity[];

  // Data Reviewer tomonidan ko'rib chiqilgan anketalar
  @OneToMany(() => SurveyEntity, (survey) => survey.reviewer)
  reviewedSurveys: SurveyEntity[];

  // Ushbu foydalanuvchi tomonidan kiritilgan status o'zgarishlari tarixi
  @OneToMany(() => EmploymentHistoryEntity, (history) => history.changedBy)
  historyCreated: EmploymentHistoryEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
