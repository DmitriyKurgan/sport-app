import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const start = process.hrtime.bigint();
    // Используем именно route pattern (e.g. /training/programs/:id), а не raw url —
    // иначе получаем cardinality-blowup.
    const route = req.route?.path ?? req.path ?? 'unknown';
    const method = req.method;

    return next.handle().pipe(
      tap({
        next: () => this.observe(method, route, res.statusCode, start),
        error: () => this.observe(method, route, res.statusCode || 500, start),
      }),
    );
  }

  private observe(method: string, route: string, status: number, start: bigint): void {
    const sec = Number(process.hrtime.bigint() - start) / 1e9;
    this.metrics.httpRequestDuration.observe({ method, route, status: String(status) }, sec);
  }
}
