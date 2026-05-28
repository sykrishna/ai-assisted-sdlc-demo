import { Controller, Get } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  @Get('metadata')
  metadata() {
    return {
      authMode: 'jwt-ready',
      status: 'bootstrap-only',
    };
  }
}
