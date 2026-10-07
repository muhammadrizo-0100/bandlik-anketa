import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterMahallaDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Mahalla nomi bo\'yicha qidirish' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Tuman bo\'yicha filter' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ description: 'Tuman ID bo\'yicha filter' })
  @IsOptional()
  @IsString()
  districtId?: string;
}
