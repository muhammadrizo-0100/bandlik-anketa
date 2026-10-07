import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { EmploymentCategory } from '../../../database/enums';

export class FilterCitizenDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Qidiruv (F.I.Sh., JSHSHIR yoki telefon)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'JSHSHIR (aniq qidirish)' })
  @IsOptional()
  @IsString()
  pinfl?: string;

  @ApiPropertyOptional({ description: 'Tuman ID bo\'yicha filter' })
  @IsOptional()
  @IsUUID('4')
  districtId?: string;

  @ApiPropertyOptional({ description: 'Mahalla ID bo\'yicha filter' })
  @IsOptional()
  @IsUUID('4')
  mahallaId?: string;

  @ApiPropertyOptional({ enum: EmploymentCategory, description: 'Bandlik toifasi bo\'yicha' })
  @IsOptional()
  @IsEnum(EmploymentCategory)
  category?: EmploymentCategory;
}
