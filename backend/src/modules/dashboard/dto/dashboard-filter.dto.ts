import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class DashboardFilterDto {
  @ApiPropertyOptional({ description: 'Muayyan tuman bo\'yicha filter' })
  @IsOptional()
  @IsUUID('4')
  districtId?: string;

  @ApiPropertyOptional({ description: 'Muayyan mahalla bo\'yicha filter' })
  @IsOptional()
  @IsUUID('4')
  mahallaId?: string;

  @ApiPropertyOptional({ description: 'Boshlanish sanasi (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Tugash sanasi (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
