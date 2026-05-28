import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';
import { authConfig } from './config/auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [ConfigModule.forFeature(authConfig)],
  controllers: [AuthController],
  providers: [AuthService, StructuredLoggerService],
  exports: [AuthService],
})
export class AuthModule {}
