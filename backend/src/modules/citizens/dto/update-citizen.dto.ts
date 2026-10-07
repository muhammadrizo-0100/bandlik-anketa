import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';
import { EmploymentCategory } from '../../../database/enums';

export class UpdateCitizenDto {
  @ApiPropertyOptional({ description: 'F.I.Sh.' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ description: "Tug'ilgan sana (YYYY-MM-DD)" })
  @IsOptional()
  @IsString()
  birthDate?: string;

  @ApiPropertyOptional({ description: 'JSHSHIR (14 ta raqam)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: "JSHSHIR aniq 14 ta raqamdan iborat bo'lishi shart" })
  pinfl?: string;

  @ApiPropertyOptional({ description: 'Telefon raqam' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Ota-ona telefon raqami' })
  @IsOptional()
  @IsString()
  parentPhone?: string;

  @ApiPropertyOptional({ description: 'Yashash manzili' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: "Ta'lim muassasasi" })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: 'Mutaxassislik' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Mahalla ID' })
  @IsOptional()
  @IsUUID('4')
  mahallaId?: string;

  @ApiPropertyOptional({ enum: EmploymentCategory, description: 'Joriy bandlik toifasi' })
  @IsOptional()
  @IsEnum(EmploymentCategory)
  currentCategory?: EmploymentCategory;

  @ApiPropertyOptional({ description: 'Holat tafsiloti' })
  @IsOptional()
  @IsString()
  currentStatusDetail?: string;
}
