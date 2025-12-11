import { Injectable } from '@nestjs/common';

import { validateEnv } from './env.validation';

type Env = ReturnType<typeof validateEnv>;

@Injectable()
export class ConfigService {
  private readonly env: Env;

  constructor() {
    this.env = validateEnv(process.env);
  }

  get dbUrl(): string {
    return (
      this.env.DATABASE_URL ||
      `postgres://${this.env.POSTGRES_USER}:${this.env.POSTGRES_PASSWORD}` +
        `@${this.env.POSTGRES_HOST}:${this.env.POSTGRES_PORT}/${this.env.POSTGRES_DB}`
    );
  }

  get sqsQueueUrl(): string {
    return this.env.SQS_QUEUE_URL;
  }

  get sqsEndpoint(): string {
    return this.env.SQS_ENDPOINT;
  }

  get awsRegion(): string {
    return this.env.AWS_REGION;
  }

  get awsAccessKeyId(): string {
    return this.env.AWS_ACCESS_KEY_ID;
  }

  get awsSecretAccessKey(): string {
    return this.env.AWS_SECRET_ACCESS_KEY;
  }

  get port(): number {
    return Number(this.env.APP_PORT);
  }
}

