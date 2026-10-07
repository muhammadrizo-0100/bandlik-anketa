import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMahallaDto {
  @ApiProperty({ example: 'Guliston', description: 'Mahalla nomi' })
  @IsString()
  @IsNotEmpty({ message: 'Mahalla nomi kiritilishi shart' })
  name: string;

  @ApiProperty({
    example: 'uuid-of-district',
    description: 'Qaysi tumanga tegishliligi (District ID)',
  })
  @IsNotEmpty({ message: 'Tuman tanlanishi shart' })
  @IsString()
  districtId: string;

  @ApiPropertyOptional({
    example: 'Davlatobod tumani',
    description: 'Tuman nomi',
  })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({
    example: 'Namangan viloyati',
    default: 'Namangan viloyati',
    description: 'Viloyat nomi',
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiPropertyOptional({ example: '1714234', description: 'SOATO yoki ichki identifikatsiya kodi' })
  @IsOptional()
  @IsString()
  code?: string;
}
