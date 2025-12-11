import { Injectable, Logger } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { ConfigService } from '../config/config.service';
import { ProductEventPayload } from './notifications.contracts';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly sqs: SQSClient;
  private readonly queueUrl: string;

  constructor(private readonly config: ConfigService) {
    this.queueUrl = config.sqsQueueUrl;
    this.sqs = new SQSClient({
      region: config.awsRegion,
      endpoint: config.sqsEndpoint,
      credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsSecretAccessKey,
      },
    });
  }

  async publish(event: ProductEventPayload) {
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(event),
    });
    await this.sqs.send(command);
    this.logger.log(`Event published: ${event.type} productId=${event.productId}`);
  }
}

