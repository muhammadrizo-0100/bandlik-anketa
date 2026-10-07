import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  RoleEntity,
  DistrictEntity,
  MahallaEntity,
  UserEntity,
  CitizenEntity,
  SurveyEntity,
  EmploymentHistoryEntity,
} from './entities';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('database.url');
        const ssl = configService.get('database.ssl');
        const commonOptions = {
          type: 'postgres' as const,
          entities: [
            RoleEntity,
            DistrictEntity,
            MahallaEntity,
            UserEntity,
            CitizenEntity,
            SurveyEntity,
            EmploymentHistoryEntity,
          ],
          autoLoadEntities: true,
          synchronize: true, // Jadvallarni avtomatik shakllantirish
          logging: configService.get<boolean>('database.logging'),
          ssl,
        };

        if (url) {
          return {
            ...commonOptions,
            url,
          };
        }

        return {
          ...commonOptions,
          host: configService.get<string>('database.host'),
          port: configService.get<number>('database.port'),
          username: configService.get<string>('database.username'),
          password: configService.get<string>('database.password'),
          database: configService.get<string>('database.database'),
        };
      },
    }),
    TypeOrmModule.forFeature([
      RoleEntity,
      DistrictEntity,
      MahallaEntity,
      UserEntity,
      CitizenEntity,
      SurveyEntity,
      EmploymentHistoryEntity,
    ]),
  ],
  providers: [SeedService],
  exports: [TypeOrmModule, SeedService],
})
export class DatabaseModule {}
