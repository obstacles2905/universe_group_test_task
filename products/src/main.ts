import 'reflect-metadata';

import * as express from 'express';
import {
  Request,
  Response,
} from 'express';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { MetricsService } from './metrics/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );

  const metricsService = app.get(MetricsService);
  const configService = app.get(ConfigService);
  app.use('/metrics', express.text(), (_req: Request, res: Response) =>
    metricsService.exportMetrics(res),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Products API')
    .setDescription('CRUD for products with SQS notifications')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('openapi', app, document);

  const port = configService.port;
  await app.listen(port);
  console.log(`Products service is running on port ${port}`);
}

bootstrap();

