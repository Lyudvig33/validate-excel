import { Module } from '@nestjs/common';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RowEntity } from './entities/row/row';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([RowEntity]),
    RedisModule,
    EventEmitterModule.forRoot()
],
  controllers: [ExcelController],
  providers: [ExcelService],
})
export class ExcelModule {}
