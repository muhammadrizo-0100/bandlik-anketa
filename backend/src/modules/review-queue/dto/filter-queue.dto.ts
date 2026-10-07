import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterQueueDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Qidiruv (F.I.Sh. yoki JSHSHIR)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Tuman ID bo\'yicha filtr' })
  @IsOptional()
  @IsUUID('4')
  districtId?: string;

  @ApiPropertyOptional({ description: 'Mahalla ID bo\'yicha filtr' })
  @IsOptional()
  @IsUUID('4')
  mahallaId?: string;
}
