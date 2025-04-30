import { ExcelModule } from './excel/excel.module';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RowEntity } from './excel/entities/row/row';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: Number(configService.get('DATABASE_PORT')),
        username: configService.get('DATABASE_USER'),
        password: String(configService.get('DATABASE_PASSWORD')),
        database: configService.get('DATABASE_NAME'),
        entities: [RowEntity],
        synchronize: configService.get('DB_SYNC') === 'true',
      }),
      inject: [ConfigService],

    }),
    ExcelModule
  ],
})
export class AppModule {}
