import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateDistrictDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  region?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;
}
