import { Module } from '@nestjs/common';
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
import redisConfig from './config/redis.config';
import { AvatarModule } from './modules/avatar/avatar.module';
import { BodyTypeModule } from './modules/body-type/body-type.module';
import { PreScreeningModule } from './modules/pre-screening/pre-screening.module';
import { ProfileModule } from './modules/profile/profile.module';
import { TrainingEngineModule } from './modules/training-engine/training-engine.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AppCacheModule } from './modules/cache/app-cache.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { MetricsModule } from './modules/metrics';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { ProgressModule } from './modules/progress/progress.module';
import { TrainingModule } from './modules/training/training.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get<string>('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            // В prod — JSON (готов к Loki/ELK), в dev — pino-pretty.
            transport: isProd
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true, colorize: true } },
            level: isProd ? 'info' : 'debug',
            // request-id для корреляции
            genReqId: (req) =>
              (req.headers['x-request-id'] as string) || randomUUID(),
            // Чтобы не светить секреты в логах
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
            // Не логируем тело тяжёлых endpoints
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
    EventEmitterModule.forRoot({
      wildcard: true,
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
    ThrottlerModule.forRoot([
      // Глобальный лимит: 100 запросов/минуту с одного IP.
      // Жёсткие per-route лимиты задаются @Throttle() на конкретных endpoints.
      { name: 'global', ttl: 60_000, limit: 100 },
    ]),
    ScheduleModule.forRoot(),
    AppCacheModule,
    MetricsModule,
    // Domain modules
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
    JobsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
