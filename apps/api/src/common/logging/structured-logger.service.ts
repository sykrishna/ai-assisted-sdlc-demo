import { Injectable, Logger } from '@nestjs/common';

type LogLevel = 'log' | 'warn' | 'error';

@Injectable()
export class StructuredLoggerService {
  private readonly logger = new Logger('Api');

  info(event: string, data: Record<string, unknown> = {}): void {
    this.write('log', event, data);
  }

  warn(event: string, data: Record<string, unknown> = {}): void {
    this.write('warn', event, data);
  }

  error(event: string, data: Record<string, unknown> = {}): void {
    this.write('error', event, data);
  }

  private write(level: LogLevel, event: string, data: Record<string, unknown>): void {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...data,
    };

    if (level === 'warn') {
      this.logger.warn(payload);
      return;
    }

    if (level === 'error') {
      this.logger.error(payload);
      return;
    }

    this.logger.log(payload);
  }
}
