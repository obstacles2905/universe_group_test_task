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
   * Gets the PostgreSQL database connection URL.
   * Uses DATABASE_URL if provided, otherwise constructs from individual env vars.
   *
   * @returns Database connection URL
   */
  get dbUrl(): string {
    return (
      this.env.DATABASE_URL ||
      `postgres://${this.env.POSTGRES_USER}:${this.env.POSTGRES_PASSWORD}` +
        `@${this.env.POSTGRES_HOST}:${this.env.POSTGRES_PORT}/${this.env.POSTGRES_DB}`
    );
  }

  /**
   * Gets the SQS queue URL for product events.
   *
   * @returns SQS queue URL
   */
  get sqsQueueUrl(): string {
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

