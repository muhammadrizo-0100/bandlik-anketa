import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsUUID,
} from 'class-validator';
import { UserRole } from '../../../database/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'operator_guliston', description: 'Tizimga kirish logini' })
  @IsString()
  @IsNotEmpty({ message: 'Username kiritilishi shart' })
  username: string;

  @ApiPropertyOptional({ example: 'operator@bandlik.uz' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'securePassword123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' })
  password: string;

  @ApiProperty({ example: 'Sardor Qodirov' })
  @IsString()
  @IsNotEmpty({ message: 'Ism-familiya majburiy' })
  fullName: string;

  @ApiProperty({ example: '+998901234567', description: 'Telefon raqami (majburiy)' })
  @IsString()
  @IsNotEmpty({ message: 'Telefon raqami kiritilishi majburiy' })
  phone: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.MAHALLA_OPERATOR,
    description: 'Foydalanuvchi roli (RBAC)',
  })
  @IsEnum(UserRole, { message: 'Yaroqli xodim rolini tanlang' })
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Tuman ID (District Admin va Mahalla Operator uchun)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Yaroqli Tuman UUID kiriting' })
  districtId?: string;

  @ApiPropertyOptional({
    description: 'Mahalla ID (faqat Mahalla Operator uchun biriktiriladi)',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Yaroqli Mahalla UUID kiriting' })
  mahallaId?: string;
}
