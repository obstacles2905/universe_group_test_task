import * as request from 'supertest';

import {
  SendMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import { INestApplication } from '@nestjs/common';
import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { ConfigService } from '../../src/config/config.service';
import {
  ProductEventPayload,
} from '../../src/contracts/notifications.contracts';
import { MetricsService } from '../../src/metrics/metrics.service';
import {
  SqsListenerService,
} from '../../src/sqs-listener/sqs-listener.service';

describe('Notifications E2E', () => {
  let app: INestApplication;
  let sqsClient: SQSClient;
  let configService: ConfigService;
  let sqsListenerService: SqsListenerService;
  let metricsService: MetricsService;
  let queueUrl: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configService = moduleFixture.get<ConfigService>(ConfigService);
    sqsListenerService = moduleFixture.get<SqsListenerService>(
      SqsListenerService,
    );
    metricsService = moduleFixture.get<MetricsService>(MetricsService);

    queueUrl = configService.queueUrl;

    sqsClient = new SQSClient({
      region: configService.awsRegion,
      endpoint: configService.sqsEndpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
      },
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('SQS Message Consumption', () => {
    it('should consume PRODUCT_CREATED event from SQS', async () => {
      const event: ProductEventPayload = {
        type: 'PRODUCT_CREATED',
        productId: 123,
        payload: {
          name: 'Test Product',
          price: '99.99',
        },
        occurredAt: new Date().toISOString(),
      };

      // Send message to SQS
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(event),
        }),
      );

      // Wait for message to be consumed (SQS listener polls every 10 seconds)
      await new Promise((resolve) => setTimeout(resolve, 12000));

      // Verify metrics were incremented
      const metrics = metricsService.getMetrics();
      const metricsText = await metrics.metrics();

      expect(metricsText).toContain('notification_messages_consumed_total');
      expect(metricsText).toMatch(/notification_messages_consumed_total \d+/);
    }, 20000);

    it('should consume PRODUCT_DELETED event from SQS', async () => {
      const event: ProductEventPayload = {
        type: 'PRODUCT_DELETED',
        productId: 456,
        occurredAt: new Date().toISOString(),
      };

      // Send message to SQS
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify(event),
        }),
      );

      // Wait for message to be consumed
      await new Promise((resolve) => setTimeout(resolve, 12000));

      // Verify metrics
      const metrics = metricsService.getMetrics();
      const metricsText = await metrics.metrics();

      expect(metricsText).toContain('notification_messages_consumed_total');
    }, 20000);
  });

  describe('GET /metrics', () => {
    it('should expose Prometheus metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/metrics')
        .expect(200);

      expect(response.text).toContain('notification_messages_consumed_total');
    });
  });
});

