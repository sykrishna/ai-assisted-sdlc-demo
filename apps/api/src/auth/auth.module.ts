import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { StructuredLoggerService } from '../common/logging/structured-logger.service';
import { authConfig } from './config/auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtTokenService } from './services/jwt-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forFeature(authConfig),
    PassportModule,
    JwtModule.register({}), // Will be configured with secrets from authConfig
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtTokenService, JwtStrategy, StructuredLoggerService],
  exports: [AuthService, JwtTokenService],
})
export class AuthModule {}
