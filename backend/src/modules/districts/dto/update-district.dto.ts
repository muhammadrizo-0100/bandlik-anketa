import { PartialType } from '@nestjs/swagger';
import { CreateDistrictDto } from './create-district.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateDistrictDto extends PartialType(CreateDistrictDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
