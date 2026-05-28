import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { authConfig } from './auth/config/auth.config';
import { StructuredLoggerService } from './common/logging/structured-logger.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [authConfig],
    }),
    HealthModule,
    AuthModule,
  ],
  providers: [StructuredLoggerService],
  exports: [StructuredLoggerService],
})
export class AppModule {}
