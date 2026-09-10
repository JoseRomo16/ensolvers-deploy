import 'reflect-metadata';
import { config as loadEnvFile } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Category } from '../categories/category.entity';
import { Note } from '../notes/note.entity';
import { InitialSchema1757980000000 } from '../migrations/1757980000000-InitialSchema';

loadEnvFile();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Copy backend/.env.example to backend/.env, or start the app with ./start.sh.',
  );
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: databaseUrl,
  // Entities and migrations are imported explicitly instead of by glob so that
  // the same config works under ts-node, the compiled dist/ output and Jest.
  entities: [Note, Category],
  migrations: [InitialSchema1757980000000],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  // Managed Postgres (Supabase, Render, ...) terminates TLS with a certificate
  // this client has no root for, so verification is relaxed when SSL is on.
  ssl:
    process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

/** Default export is what the TypeORM CLI picks up for migrations. */
export default new DataSource(dataSourceOptions);
