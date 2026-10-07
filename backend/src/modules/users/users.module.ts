import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserEntity } from '../../database/entities/user.entity';
import { RoleEntity } from '../../database/entities/role.entity';
import { DistrictEntity } from '../../database/entities/district.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      RoleEntity,
      DistrictEntity,
      MahallaEntity,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
