import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MahallaEntity } from './mahalla.entity';
import { UserEntity } from './user.entity';
import { CitizenEntity } from './citizen.entity';
import { SurveyEntity } from './survey.entity';

@Entity('districts')
export class DistrictEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 100, default: 'Namangan viloyati' })
  region: string;

  @Column({ length: 50, nullable: true, unique: true })
  code?: string;

  @Column({ default: true })
  isActive: boolean;

  // Tumanga qarashli mahallalar
  @OneToMany(() => MahallaEntity, (mahalla) => mahalla.district)
  mahallas: MahallaEntity[];

  // Tumanga biriktirilgan ma'murlar va operatorlar
  @OneToMany(() => UserEntity, (user) => user.district)
  users: UserEntity[];

  // Tumandagi barcha fuqarolar
  @OneToMany(() => CitizenEntity, (citizen) => citizen.district)
  citizens: CitizenEntity[];

  // Tumandagi barcha so'rovnomalar
  @OneToMany(() => SurveyEntity, (survey) => survey.district)
  surveys: SurveyEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
