import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserRole } from '../../../database/enums';

export class FilterUserDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Qidiruv (Ism, username yoki telefon)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: UserRole, description: 'Rol bo\'yicha filtr' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Tuman ID bo\'yicha filtr' })
  @IsOptional()
  @IsUUID('4')
  districtId?: string;

  @ApiPropertyOptional({ description: 'Mahalla ID bo\'yicha filtr' })
  @IsOptional()
  @IsUUID('4')
  mahallaId?: string;

  @ApiPropertyOptional({ description: 'Hisob faolligi bo\'yicha filtr' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
