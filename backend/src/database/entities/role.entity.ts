import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../enums';
import { UserEntity } from './user.entity';

@Entity('roles')
export class RoleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    unique: true,
  })
  code: UserRole;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => UserEntity, (user) => user.role)
  users: UserEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
