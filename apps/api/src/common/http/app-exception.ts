import { HttpException } from '@nestjs/common';
import type { ProblemDetails } from './problem-details';

type AppExceptionOptions = {
  status: number;
  code: string;
  title: string;
  detail: string;
  retryable?: boolean;
  type?: string;
};

export class AppException extends HttpException {
  readonly code: string;
  readonly title: string;
  readonly detail: string;
  readonly retryable: boolean;
  readonly type: string;

  constructor(options: AppExceptionOptions) {
    super(options.detail, options.status);
    this.code = options.code;
    this.title = options.title;
    this.detail = options.detail;
    this.retryable = options.retryable ?? false;
    this.type = options.type ?? `https://api.example.com/errors/${options.code.toLowerCase()}`;
  }

  toProblemDetails(correlationId: string): ProblemDetails {
    return {
      type: this.type,
      title: this.title,
      status: this.getStatus(),
      code: this.code,
      detail: this.detail,
      correlationId,
      timestamp: new Date().toISOString(),
      retryable: this.retryable,
    };
  }
}
