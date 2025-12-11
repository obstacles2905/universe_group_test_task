import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as express from 'express';
import { Request, Response } from 'express';
import { AppModule } from './app.module';
import { MetricsService } from './metrics/metrics.service';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const metrics = app.get(MetricsService);
  const config = app.get(ConfigService);
  app.use('/metrics', express.text(), (_req: Request, res: Response) =>
    metrics.exportMetrics(res),
  );

  const port = config.port;
  await app.listen(port);
  console.log(`Notifications service listening on port ${port}`);
}

bootstrap();

