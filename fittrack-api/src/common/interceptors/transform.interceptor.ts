import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T> | T> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | T> {
    return next.handle().pipe(
      map((data) => {
        // Если ответ уже имеет поле meta (paginated) — не оборачиваем
        if (data && typeof data === 'object' && 'meta' in data) return data;
        return data;
      }),
    );
  }
}
