import type { ExecutionContext } from '@nestjs/common';
import { createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';

type CorrelationRequest = Request & {
  correlationId?: string;
};

export const CorrelationId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const request = context.switchToHttp().getRequest<CorrelationRequest>();
    return request.correlationId ?? 'unknown';
  },
);
