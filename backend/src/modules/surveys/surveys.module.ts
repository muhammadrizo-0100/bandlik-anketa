import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyEntity } from '../../database/entities/survey.entity';
import { CitizenEntity } from '../../database/entities/citizen.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { EmploymentHistoryEntity } from '../../database/entities/employment-history.entity';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SurveyEntity,
      CitizenEntity,
      MahallaEntity,
      EmploymentHistoryEntity,
    ]),
  ],
  controllers: [SurveysController],
  providers: [SurveysService],
  exports: [SurveysService],
})
export class SurveysModule {}
