import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'superadmin',
    description: 'Login (username yoki email)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Login kiritilishi shart' })
  username: string;

  @ApiProperty({ example: 'your_password', description: 'Parol' })
  @IsString()
  @IsNotEmpty({ message: 'Parol kiritilishi shart' })
  password: string;
}
