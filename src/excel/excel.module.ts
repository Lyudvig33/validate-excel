import { Module } from '@nestjs/common';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RowEntity } from './entities/row/row';

@Module({
  imports: [TypeOrmModule.forFeature([RowEntity])],
  controllers: [ExcelController],
  providers: [ExcelService],
})
export class ExcelModule {}
