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
import { DistrictEntity } from './district.entity';
import { MahallaEntity } from './mahalla.entity';
import { SurveyEntity } from './survey.entity';
import { EmploymentHistoryEntity } from './employment-history.entity';
import { EmploymentCategory } from '../enums';

@Entity('citizens')
export class CitizenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // F.I.Sh. (Majburiy)
  @Column({ length: 150 })
  fullName: string;

  // Tug'ilgan sana (Majburiy)
  @Column({ type: 'date' })
  birthDate: Date;

  // JSHSHIR (Qat'iy 14 ta raqam, unikal)
  @Index({ unique: true })
  @Column({ length: 14 })
  pinfl: string;

  // Fuqaro telefon raqami (Ixtiyoriy)
  @Column({ length: 30, nullable: true })
  phone?: string;

  // Ota-onasi yoki vasiysining telefon raqami (Ixtiyoriy)
  @Column({ length: 30, nullable: true })
  parentPhone?: string;

  // Yashash manzili (Majburiy)
  @Column({ type: 'text' })
  address: string;

  // Qaysi ta'lim muassasasini tugatganligi (Majburiy)
  @Column({ length: 255 })
  education: string;

  // Mutaxassisligi (Ixtiyoriy)
  @Column({ length: 150, nullable: true })
  specialty?: string;

  // Qaysi mahallaga tegishliligi (Majburiy)
  @ManyToOne(() => MahallaEntity, (mahalla) => mahalla.citizens, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'mahalla_id' })
  mahalla: MahallaEntity;

  @Column({ name: 'mahalla_id' })
  mahallaId: string;

  @ManyToOne(() => DistrictEntity, (district) => district.citizens, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'district_id' })
  district: DistrictEntity;

  @Column({ name: 'district_id' })
  districtId: string;

  // Joriy bandlik toifasi (2.1 - 2.5 asosiy kategoriyalar)
  @Column({
    type: 'enum',
    enum: EmploymentCategory,
    nullable: true,
  })
  currentCategory?: EmploymentCategory;

  // Joriy holat tafsiloti (ish joyi, faoliyat turi, sabab va h.k.)
  @Column({ type: 'text', nullable: true })
  currentStatusDetail?: string;

  // Fuqaroning to'ldirilgan so'rovnomalari
  @OneToMany(() => SurveyEntity, (survey) => survey.citizen)
  surveys: SurveyEntity[];

  // Fuqaroning bandlik tarixi loglari
  @OneToMany(() => EmploymentHistoryEntity, (history) => history.citizen)
  employmentHistory: EmploymentHistoryEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
