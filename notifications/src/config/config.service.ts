import { Injectable } from '@nestjs/common';

import { validateEnv } from './env.validation';

type Env = ReturnType<typeof validateEnv>;

@Injectable()
export class ConfigService {
  private readonly env: Env;

  constructor() {
    this.env = validateEnv(process.env);
  }

  /**
   * Gets the SQS queue URL for product events.
   *
   * @returns SQS queue URL
   */
  get queueUrl(): string {
    return this.env.SQS_QUEUE_URL;
  }

  /**
   * Gets the SQS endpoint URL (LocalStack or AWS).
   *
   * @returns SQS endpoint URL
   */
  get sqsEndpoint(): string {
    return this.env.SQS_ENDPOINT;
  }

  /**
   * Gets the AWS region for SQS.
   *
   * @returns AWS region string
   */
  get awsRegion(): string {
    return this.env.AWS_REGION;
  }

  /**
   * Gets the AWS access key ID.
   *
   * @returns AWS access key ID
   */
  get awsAccessKeyId(): string {
    return this.env.AWS_ACCESS_KEY_ID;
  }

  /**
   * Gets the AWS secret access key.
   *
   * @returns AWS secret access key
   */
  get awsSecretAccessKey(): string {
    return this.env.AWS_SECRET_ACCESS_KEY;
  }

  /**
   * Gets the application port number.
   *
   * @returns Port number
   */
  get port(): number {
    return Number(this.env.APP_PORT);
  }
}

