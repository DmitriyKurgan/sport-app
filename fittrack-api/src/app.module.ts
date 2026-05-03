import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import mailConfig from './config/mail.config';
import redisConfig from './config/redis.config';
import { AvatarModule } from './modules/avatar/avatar.module';
import { BodyTypeModule } from './modules/body-type/body-type.module';
import { PreScreeningModule } from './modules/pre-screening/pre-screening.module';
import { ProfileModule } from './modules/profile/profile.module';
import { TrainingEngineModule } from './modules/training-engine/training-engine.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AppCacheModule } from './modules/cache/app-cache.module';
import { NoOpCacheModule } from './modules/cache/no-op-cache.module';
import { HealthModule } from './modules/health/health.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MailModule } from './modules/mail/mail.module';
import { MetricsModule } from './modules/metrics';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { ProgressModule } from './modules/progress/progress.module';
import { TrainingModule } from './modules/training/training.module';
import { UserModule } from './modules/user/user.module';

/**
 * Динамическая сборка AppModule.
 * Если Redis недоступен (REDIS_ENABLED=false или REDIS_HOST не задан) — деплой работает без Bull/Cron/Cache:
 *   - подменяем AppCacheModule на NoOpCacheModule
 *   - не импортируем BullModule.forRoot() и JobsModule
 *   - доменная логика и события через EventEmitter работают штатно.
 */
@Module({})
export class AppModule {
  static register(): DynamicModule {
    const redisEnabled =
      process.env.REDIS_ENABLED !== 'false' && !!process.env.REDIS_HOST;

    const conditional = redisEnabled
      ? [
          BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
              redis: {
                host: config.get<string>('redis.host')!,
                port: config.get<number>('redis.port')!,
                password: config.get<string>('redis.password') || undefined,
              },
            }),
          }),
          ScheduleModule.forRoot(),
          AppCacheModule,
          JobsModule,
        ]
      : [NoOpCacheModule];

    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.local', '.env'],
          load: [appConfig, databaseConfig, jwtConfig, mailConfig, redisConfig],
        }),
        LoggerModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const isProd = config.get<string>('NODE_ENV') === 'production';
            return {
              pinoHttp: {
                transport: isProd
                  ? undefined
                  : { target: 'pino-pretty', options: { singleLine: true, colorize: true } },
                level: isProd ? 'info' : 'debug',
                genReqId: (req) =>
                  (req.headers['x-request-id'] as string) || randomUUID(),
                redact: {
                  paths: [
                    'req.headers.authorization',
                    'req.headers.cookie',
                    'req.body.password',
                    'req.body.refreshToken',
                    'req.body.accessToken',
                    'res.headers["set-cookie"]',
                    '*.password',
                    '*.passwordHash',
                    '*.refreshToken',
                    '*.accessToken',
                  ],
                  censor: '***',
                },
                serializers: {
                  req(req) {
                    return {
                      id: req.id,
                      method: req.method,
                      url: req.url,
                      remoteAddress: req.remoteAddress,
                    };
                  },
                },
                customLogLevel: (_req, res, err) => {
                  if (err || res.statusCode >= 500) return 'error';
                  if (res.statusCode >= 400) return 'warn';
                  return 'info';
                },
              },
            };
          },
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => config.get('database')!,
        }),
        EventEmitterModule.forRoot({
          wildcard: true,
          maxListeners: 20,
          verboseMemoryLeak: true,
        }),
        ThrottlerModule.forRoot([
          { name: 'global', ttl: 60_000, limit: 100 },
        ]),
        MetricsModule,
        HealthModule,
        MailModule,
        ...conditional,
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
      providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
    };
  }
}
