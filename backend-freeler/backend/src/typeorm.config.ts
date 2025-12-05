import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'fs';
import * as path from 'path';

const cwd = process.cwd();
const nodeEnv = process.env.NODE_ENV ?? 'development';
const envFiles = ['.env', `.env.${nodeEnv}`, '.env.local'];

for (const file of envFiles) {
  const fullPath = path.resolve(cwd, file);
  if (existsSync(fullPath)) {
    loadEnv({ path: fullPath, override: true });
  }
}

const toBool = (value?: string) => (value ?? '').toLowerCase() === 'true';

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  schema: 'freeler',
  entities: [path.resolve(__dirname, '**/*.entity.{ts,js}')],
  migrations: [path.resolve(__dirname, 'database/migrations/*.{ts,js}')],
  ssl: toBool(process.env.DB_SSL) ? { rejectUnauthorized: false } : false,
  extra: {
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 10,
  },
  logging: ['error'],
  synchronize: false,
});

export default dataSource;
