import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveyEntity } from '../../database/entities/survey.entity';
import { CitizenEntity } from '../../database/entities/citizen.entity';
import { EmploymentHistoryEntity } from '../../database/entities/employment-history.entity';
import { ReviewQueueService } from './review-queue.service';
import { ReviewQueueController } from './review-queue.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SurveyEntity,
      CitizenEntity,
      EmploymentHistoryEntity,
    ]),
  ],
  controllers: [ReviewQueueController],
  providers: [ReviewQueueService],
  exports: [ReviewQueueService],
})
export class ReviewQueueModule {}
