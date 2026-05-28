import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { CorrelationIdInterceptor } from './common/http/correlation-id.interceptor';
import { ProblemDetailsFilter } from './common/http/problem-details.filter';
import { StructuredLoggerService } from './common/logging/structured-logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(StructuredLoggerService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalInterceptors(new CorrelationIdInterceptor(logger));
  app.useGlobalFilters(new ProblemDetailsFilter(logger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      transform: true,
    }),
  );
  await app.listen(process.env.API_PORT ? Number(process.env.API_PORT) : 3001);
}

void bootstrap();
