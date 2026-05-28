import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AppException } from './app-exception';
import { PROBLEM_CONTENT_TYPE, type ProblemDetails } from './problem-details';
import type { StructuredLoggerService } from '../logging/structured-logger.service';

type CorrelationRequest = Request & {
  correlationId?: string;
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  constructor(private readonly logger: StructuredLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<CorrelationRequest>();
    const correlationId = request.correlationId ?? 'unknown';

    const problem = this.toProblemDetails(exception, correlationId);

    this.logger.error('http.request.failed', {
      correlationId,
      method: request.method,
      path: request.originalUrl,
      statusCode: problem.status,
      code: problem.code,
      detail: problem.detail,
    });

    response.status(problem.status).type(PROBLEM_CONTENT_TYPE).json(problem);
  }

  private toProblemDetails(exception: unknown, correlationId: string): ProblemDetails {
    if (exception instanceof AppException) {
      return exception.toProblemDetails(correlationId);
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return {
        type: 'https://api.example.com/errors/http-exception',
        title: HttpStatus[status] ?? 'HTTP Exception',
        status,
        code: 'HTTP_EXCEPTION',
        detail: this.toErrorDetail(exception.getResponse()),
        correlationId,
        timestamp: new Date().toISOString(),
        retryable: status >= 500,
      };
    }

    return {
      type: 'https://api.example.com/errors/internal-server-error',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'AUTH_INTERNAL_ERROR',
      detail: 'Unexpected server error.',
      correlationId,
      timestamp: new Date().toISOString(),
      retryable: true,
    };
  }

  private toErrorDetail(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }

    const detail = response as { message?: string | string[]; detail?: string };
    if (Array.isArray(detail.message)) {
      return detail.message.join('; ');
    }

    return detail.detail ?? detail.message ?? 'Request failed.';
  }
}
