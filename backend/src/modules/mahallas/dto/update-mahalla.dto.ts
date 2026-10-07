import { PartialType } from '@nestjs/swagger';
import { CreateMahallaDto } from './create-mahalla.dto';

export class UpdateMahallaDto extends PartialType(CreateMahallaDto) {}
