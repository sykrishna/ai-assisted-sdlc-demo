import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { StructuredLoggerService } from '../logging/structured-logger.service';

type CorrelationRequest = Request & {
  correlationId?: string;
};

const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  constructor(private readonly logger: StructuredLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<CorrelationRequest>();
    const response = httpContext.getResponse<Response>();

    const headerValue = request.headers[CORRELATION_ID_HEADER];
    const incomingCorrelationId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const correlationId =
      incomingCorrelationId && incomingCorrelationId.trim().length > 0
        ? incomingCorrelationId
        : randomUUID();

    request.correlationId = correlationId;
    response.setHeader('X-Correlation-Id', correlationId);

    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.info('http.request.completed', {
          correlationId,
          method: request.method,
          path: request.originalUrl,
          statusCode: response.statusCode,
          durationMs: Date.now() - startedAt,
        });
      }),
    );
  }
}
