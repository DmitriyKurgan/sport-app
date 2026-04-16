import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const url = process.env.DATABASE_URL;
const isProd = process.env.NODE_ENV === 'production';
const ssl = isProd ? { rejectUnauthorized: false } : false;

const opts: DataSourceOptions = url
  ? {
      type: 'postgres',
      url,
      ssl,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: false,
      logging: true,
    }
  : {
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'fittrack',
      ssl,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: false,
      logging: true,
    };

export default new DataSource(opts);
