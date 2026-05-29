import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { authConfig } from '../auth/config/auth.config';
import { HealthController } from './health.controller';

@Module({
  imports: [ConfigModule.forFeature(authConfig)],
  controllers: [HealthController],
})
export class HealthModule {}
