import {
  DeleteMessageBatchCommand,
  Message,
  ReceiveMessageCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';

import { ConfigService } from '../config/config.service';
import { ProductEventPayload } from '../contracts/notifications.contracts';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class SqsListenerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsListenerService.name);
  private readonly sqs: SQSClient;
  private polling = true;

  constructor(
    private readonly config: ConfigService,
    private readonly metrics: MetricsService,
  ) {
    this.sqs = new SQSClient({
      region: config.awsRegion,
      endpoint: config.sqsEndpoint,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    });
  }

  onModuleInit() {
    this.loop();
  }

  onModuleDestroy() {
    this.polling = false;
  }

  private async loop() {
    while (this.polling) {
      try {
        await this.pollOnce();
      } catch (err) {
        this.logger.error('SQS poll failed', err as Error);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  private async pollOnce() {
    const command = new ReceiveMessageCommand({
      QueueUrl: this.config.queueUrl,
      WaitTimeSeconds: 10,
      MaxNumberOfMessages: 10,
    });

    const response = await this.sqs.send(command);
    const messages = response.Messages || [];
    if (!messages.length) return;

    for (const message of messages) {
      this.metrics.messagesConsumed.inc();
      const parsed = this.parseMessage(message.Body);
      if (parsed) {
        this.logger.log(
          `Message received: type=${parsed.type} productId=${parsed.productId}`,
        );
      } else {
        this.logger.warn(`Message received (unparsed): ${message.Body}`);
      }
    }

    await this.deleteBatch(messages);
  }

  private async deleteBatch(messages: Message[]) {
    const entries = messages.map((m) => ({
      Id: m.MessageId || `${Date.now()}`,
      ReceiptHandle: m.ReceiptHandle!,
    }));

    if (!entries.length) return;

    await this.sqs.send(
      new DeleteMessageBatchCommand({
        QueueUrl: this.config.queueUrl,
        Entries: entries,
      }),
    );
  }

  private parseMessage(body?: string): ProductEventPayload | null {
    if (!body) return null;
    try {
      const payload = JSON.parse(body) as ProductEventPayload;
      if (payload && payload.type && payload.productId) {
        return payload;
      }
      return null;
    } catch (err) {
      this.logger.warn(`Failed to parse message body: ${(err as Error).message}`);
      return null;
    }
  }
}

