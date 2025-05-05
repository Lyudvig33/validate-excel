import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { RowEntity } from 'src/excel/entities/row/row';

config();
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  entities: [RowEntity],
  synchronize: true,
});
