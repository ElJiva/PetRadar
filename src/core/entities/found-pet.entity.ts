import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PetSpecies } from '../enums/pet-species.enum';
import type { Point } from 'typeorm';

@Entity('found_pets')
export class FoundPet {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  description!: string;

  @Column({ type: 'int' })
  species!: PetSpecies;

  @Column()
  reporterContact!: string;

  @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  location!: Point;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
