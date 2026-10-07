import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres_secret',
  database: process.env.POSTGRES_DB || 'bandlik_monitoring',
  ssl: process.env.DATABASE_URL || process.env.POSTGRES_SSL === 'true'
    ? { rejectUnauthorized: false }
    : false,
  synchronize:
    process.env.DB_SYNCHRONIZE === 'true' ||
    (process.env.DB_SYNCHRONIZE === undefined &&
      process.env.NODE_ENV !== 'production'),
  logging: process.env.NODE_ENV === 'development',
}));
