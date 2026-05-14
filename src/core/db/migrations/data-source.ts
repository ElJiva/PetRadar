import { envs } from 'src/config/envs';
import { LostPet } from 'src/core/entities/lost-pet.entity';
import { FoundPet } from 'src/core/entities/found-pet.entity';
import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOptions: DataSourceOptions = {
  host: envs.DB_HOST,
  database: envs.DB_NAME,
  username: envs.DB_USER,
  password: envs.DB_PASSWORD,
  port: envs.DB_PORT,
  type: 'postgres',
  entities: [LostPet, FoundPet],
  synchronize: false,
  migrationsRun: true,
  migrations: ['dist/core/db/migrations/[0-9]*-*.js'],
};

export const dataSource = new DataSource(dataSourceOptions);
