import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizenEntity } from '../../database/entities/citizen.entity';
import { SurveyEntity } from '../../database/entities/survey.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CitizenEntity, SurveyEntity, MahallaEntity]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
