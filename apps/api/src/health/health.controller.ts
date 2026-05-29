import { Controller, Get, Inject } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { authConfig } from '../auth/config/auth.config';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(authConfig.KEY)
    private readonly auth: ConfigType<typeof authConfig>,
  ) {}

  @Get()
  readiness() {
    return {
      dependencies: {
        auth: {
          detail: `JWT readiness configured for audience ${this.auth.audience}.`,
          status: 'ok',
        },
      },
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
    };
  }
}
