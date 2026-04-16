import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { I18nValidationPipe } from './common/pipes/i18n-validation.pipe';
import { MetricsInterceptor, MetricsService } from './modules/metrics';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  // pino перехватывает Nest Logger (включая SQL-запросы, событийные эмиттеры и т.п.)
  app.useLogger(app.get(PinoLogger));
  const config = app.get(ConfigService);

  // Доверяем заголовкам прокси (X-Forwarded-For) — нужно для корректной работы
  // throttler-а и логирования IP, когда стоим за Caddy/Nginx.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(helmet({
    // CSP отключён: фронт отдаётся отдельным сервисом (Next.js), а API возвращает только JSON.
    // helmet всё равно проставит X-Frame-Options=SAMEORIGIN, X-Content-Type-Options=nosniff,
    // Strict-Transport-Security (если за HTTPS), Referrer-Policy и т.д.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  // Лимит payload — защита от DoS большими телами. 1MB достаточно для всех наших DTO.
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ limit: '1mb', extended: true }));

  app.setGlobalPrefix(config.get<string>('app.apiPrefix', 'api/v1'), {
    // /metrics — отдельный root-path для Prometheus scrape
    exclude: ['metrics'],
  });

  app.enableCors({
    origin: config.get<string>('app.corsOrigin', 'http://localhost:3000'),
    credentials: true,
  });

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new MetricsInterceptor(app.get(MetricsService)),
  );

  const port = config.get<number>('app.port', 3001);
  await app.listen(port);

  Logger.log(`🚀 FitTrack API running on http://localhost:${port}/${config.get('app.apiPrefix')}`, 'Bootstrap');
}

bootstrap();
