import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rows')
export class RowEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  sourceId: number;

  @Column()
  name: string;

  @Column()
  date: Date;
}
