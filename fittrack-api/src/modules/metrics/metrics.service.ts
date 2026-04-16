import { Injectable, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  // Auth: попытки регистрации/логина по результату
  readonly authAttempts = new Counter({
    name: 'fittrack_auth_attempts_total',
    help: 'Auth attempts (register/login/refresh)',
    labelNames: ['endpoint', 'result'] as const,
    registers: [this.registry],
  });

  // Сколько программ сгенерировано (для мониторинга нагрузки на TrainingEngine)
  readonly programsGenerated = new Counter({
    name: 'fittrack_programs_generated_total',
    help: 'Total training programs generated',
    registers: [this.registry],
  });

  readonly programGenerationDuration = new Histogram({
    name: 'fittrack_program_generation_duration_seconds',
    help: 'TrainingEngine.generate() duration',
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.registry],
  });

  // Логи прогресса (важная бизнес-метрика — активность пользователей)
  readonly progressLogs = new Counter({
    name: 'fittrack_progress_logs_total',
    help: 'Total progress logs created',
    labelNames: ['type'] as const, // set | session_rpe
    registers: [this.registry],
  });

  // HTTP: латенция per route — гистограмма
  readonly httpRequestDuration = new Histogram({
    name: 'fittrack_http_request_duration_seconds',
    help: 'HTTP request duration',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.registry],
  });

  onModuleInit() {
    collectDefaultMetrics({ register: this.registry, prefix: 'fittrack_' });
  }
}
