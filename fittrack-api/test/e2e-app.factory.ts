import { Global, INestApplication, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import appConfig from '../src/config/app.config';
import databaseConfig from '../src/config/database.config';
import jwtConfig from '../src/config/jwt.config';
import redisConfig from '../src/config/redis.config';

import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { I18nValidationPipe } from '../src/common/pipes/i18n-validation.pipe';

import { AlertsModule } from '../src/modules/alerts/alerts.module';
import { AnalyticsModule } from '../src/modules/analytics/analytics.module';
import { AvatarModule } from '../src/modules/avatar/avatar.module';
import { BodyTypeModule } from '../src/modules/body-type/body-type.module';
import { NutritionModule } from '../src/modules/nutrition/nutrition.module';
import { PreScreeningModule } from '../src/modules/pre-screening/pre-screening.module';
import { ProfileModule } from '../src/modules/profile/profile.module';
import { ProgressModule } from '../src/modules/progress/progress.module';
import { TrainingEngineModule } from '../src/modules/training-engine/training-engine.module';
import { TrainingModule } from '../src/modules/training/training.module';
import { UserModule } from '../src/modules/user/user.module';
import { MailModule } from '../src/modules/mail/mail.module';
import { AppCacheService } from '../src/modules/cache/app-cache.service';
import { MetricsModule } from '../src/modules/metrics';

class NoopCacheService {
  async get<T>(_: string): Promise<T | null> {
    return null;
  }
  async set<T>(_: string, __: T, ___: number): Promise<void> {}
  async del(_: string): Promise<void> {}
  async delMany(_: string[]): Promise<void> {}
  async getOrCompute<T>(_: string, __: number, compute: () => Promise<T>): Promise<T> {
    return compute();
  }
}

@Global()
@Module({
  providers: [{ provide: AppCacheService, useClass: NoopCacheService }],
  exports: [AppCacheService],
})
class TestCacheModule {}

/**
 * E2E AppModule:
 * - реальная PG (DATABASE_NAME=fittrack_test, dropSchema + migrationsRun)
 * - без BullModule/JobsModule/Redis-кэша/ScheduleModule
 * - вместо AppCacheModule подключён TestCacheModule с NoopCacheService.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.test', '.env.local', '.env'],
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...(config.get('database')!),
        synchronize: false,
        dropSchema: true,
        migrationsRun: true,
      }),
    }),
    EventEmitterModule.forRoot({ wildcard: true, maxListeners: 20 }),
    TestCacheModule,
    MetricsModule,
    MailModule,
    UserModule,
    PreScreeningModule,
    ProfileModule,
    BodyTypeModule,
    AvatarModule,
    TrainingEngineModule,
    TrainingModule,
    ProgressModule,
    NutritionModule,
    AnalyticsModule,
    AlertsModule,
  ],
})
class E2EAppModule {}

export interface E2ESetup {
  app: INestApplication;
  module: TestingModule;
  baseUrl: string;
}

export async function createE2EApp(): Promise<E2ESetup> {
  process.env.DATABASE_NAME = process.env.DATABASE_NAME_TEST || 'fittrack_test';
  process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-256-bit-1234567890abcdef';
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-256-bit-1234567890abcdef';
  process.env.JWT_ACCESS_EXPIRY = '15m';
  process.env.JWT_REFRESH_EXPIRY = '7d';
  process.env.BCRYPT_ROUNDS = '4';

  const moduleFixture = await Test.createTestingModule({
    imports: [E2EAppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.init();

  return { app, module: moduleFixture, baseUrl: '/api/v1' };
}

export async function teardownE2EApp(setup: E2ESetup | undefined): Promise<void> {
  if (!setup) return;
  await setup.app.close();
}
