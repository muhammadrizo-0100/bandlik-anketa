import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DistrictEntity } from './district.entity';
import { UserEntity } from './user.entity';
import { CitizenEntity } from './citizen.entity';
import { SurveyEntity } from './survey.entity';

@Entity('mahallas')
export class MahallaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ name: 'district_id' })
  districtId: string;

  @ManyToOne(() => DistrictEntity, (district) => district.mahallas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'district_id' })
  district: DistrictEntity;

  @Column({ length: 100, default: 'Namangan viloyati' })
  region: string;

  @Column({ length: 50, nullable: true })
  code?: string;

  // Mahalla bo'yicha biriktirilgan operatorlar (Yetakchilar)
  @OneToMany(() => UserEntity, (user) => user.mahalla)
  operators: UserEntity[];

  // Mahallada yashovchi fuqarolar
  @OneToMany(() => CitizenEntity, (citizen) => citizen.mahalla)
  citizens: CitizenEntity[];

  // Mahallada o'tkazilgan so'rovnomalar
  @OneToMany(() => SurveyEntity, (survey) => survey.mahalla)
  surveys: SurveyEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
