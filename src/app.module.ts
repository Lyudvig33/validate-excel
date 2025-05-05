import { ExcelModule } from './excel/excel.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RowEntity } from './excel/entities/row/row';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: Number(configService.get('DB_PORT')),
        username: configService.get('DB_USER'),
        password: String(configService.get('DB_PASSWORD')),
        database: configService.get('DB_NAME'),
        entities: [RowEntity],
        synchronize: true,
      }),
    }),
    ExcelModule,
  ],
})
export class AppModule {}
