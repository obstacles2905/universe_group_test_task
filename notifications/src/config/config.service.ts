import { Injectable } from '@nestjs/common';

import { validateEnv } from './env.validation';

type Env = ReturnType<typeof validateEnv>;

@Injectable()
export class ConfigService {
  private readonly env: Env;

  constructor() {
    this.env = validateEnv(process.env);
  }

  get queueUrl(): string {
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

