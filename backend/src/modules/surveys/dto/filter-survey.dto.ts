import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import {
  SurveyStatus,
  EmploymentCategory,
  SurveyMethod,
} from '../../../database/enums';

export class FilterSurveyDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Qidiruv (F.I.Sh. yoki JSHSHIR)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: SurveyStatus, description: 'So\'rovnoma holati' })
  @IsOptional()
  @IsEnum(SurveyStatus)
  status?: SurveyStatus;

  @ApiPropertyOptional({ enum: EmploymentCategory, description: 'Bandlik toifasi' })
  @IsOptional()
  @IsEnum(EmploymentCategory)
  category?: EmploymentCategory;

  @ApiPropertyOptional({ enum: SurveyMethod, description: 'O\'rganish shakli' })
  @IsOptional()
  @IsEnum(SurveyMethod)
  method?: SurveyMethod;

  @ApiPropertyOptional({ description: 'Tuman ID' })
  @IsOptional()
  @IsUUID('4')
  districtId?: string;

  @ApiPropertyOptional({ description: 'Mahalla ID' })
  @IsOptional()
  @IsUUID('4')
  mahallaId?: string;

  @ApiPropertyOptional({ description: 'Operator ID' })
  @IsOptional()
  @IsUUID('4')
  operatorId?: string;

  @ApiPropertyOptional({ description: 'Boshlanish sanasi (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tugash sanasi (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
