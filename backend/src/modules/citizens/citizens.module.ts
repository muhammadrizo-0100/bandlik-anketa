import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizenEntity } from '../../database/entities/citizen.entity';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { CitizensService } from './citizens.service';
import { CitizensController } from './citizens.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CitizenEntity, MahallaEntity])],
  controllers: [CitizensController],
  providers: [CitizensService],
  exports: [CitizensService],
})
export class CitizensModule {}
