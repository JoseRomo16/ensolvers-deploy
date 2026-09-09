import 'reflect-metadata';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { config as loadEnvFile } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Category } from '../categories/category.entity';
import { Note } from '../notes/note.entity';
import { InitialSchema1757462400000 } from '../migrations/1757462400000-InitialSchema';

loadEnvFile();

/** Project root is `backend/`, so relative DB paths behave the same from src/ and dist/. */
const backendRoot = resolve(__dirname, '..', '..');

const rawDbPath = process.env.DB_PATH ?? 'data/notes.sqlite';
const databasePath = isAbsolute(rawDbPath)
  ? rawDbPath
  : resolve(backendRoot, rawDbPath);

// better-sqlite3 will not create missing directories on its own.
const databaseDir = dirname(databasePath);
if (!existsSync(databaseDir)) {
  mkdirSync(databaseDir, { recursive: true });
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'better-sqlite3',
  database: databasePath,
  // Entities and migrations are imported explicitly instead of by glob so that
  // the same config works under ts-node, the compiled dist/ output and Jest.
  entities: [Note, Category],
  migrations: [InitialSchema1757462400000],
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
};

/** Default export is what the TypeORM CLI picks up for migrations. */
export default new DataSource(dataSourceOptions);
