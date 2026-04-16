import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * DATABASE_URL имеет приоритет (Render/Heroku-style: postgres://user:pass@host:port/db).
 * Если не задан — собираем из отдельных полей.
 *
 * Render для своих managed PG требует SSL — включаем автоматически в production.
 */
function buildOptions(): TypeOrmModuleOptions {
  const url = process.env.DATABASE_URL;
  const isProd = process.env.NODE_ENV === 'production';
  const ssl = isProd ? { rejectUnauthorized: false } : false;

  const common: Partial<TypeOrmModuleOptions> = {
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: process.env.DATABASE_SYNCHRONIZE === 'true',
    logging: process.env.DATABASE_LOGGING === 'true',
    migrationsRun: false,
  };

  if (url) {
    return {
      type: 'postgres',
      url,
      ssl,
      ...common,
    } as TypeOrmModuleOptions;
  }

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'fittrack',
    ssl,
    ...common,
  } as TypeOrmModuleOptions;
}

export default registerAs('database', buildOptions);
