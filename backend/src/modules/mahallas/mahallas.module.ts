import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MahallaEntity } from '../../database/entities/mahalla.entity';
import { MahallasService } from './mahallas.service';
import { MahallasController } from './mahallas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MahallaEntity])],
  controllers: [MahallasController],
  providers: [MahallasService],
  exports: [MahallasService],
})
export class MahallasModule {}
