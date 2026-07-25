import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * OpenAPI: POST /swap/quote → 200.
 * Production currently emits 201; normalize before the response is flushed.
 */
@Injectable()
export class SwapQuoteHttp200Interceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{ method?: string; url?: string; originalUrl?: string }>();
    const res = http.getResponse<{ statusCode?: number; status: (code: number) => void }>();

    return next.handle().pipe(
      map((data) => {
        const url = String(req.originalUrl || req.url || '');
        if (
          req.method === 'POST' &&
          url.includes('/swap/quote') &&
          res.statusCode === 201
        ) {
          res.status(200);
        }
        return data;
      }),
    );
  }
}
