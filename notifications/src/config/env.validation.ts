import * as dotenv from 'dotenv';
import * as Joi from 'joi';

dotenv.config();

export interface NotificationsEnv {
  SQS_QUEUE_URL: string;
  SQS_ENDPOINT: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  NOTIFICATIONS_PORT: number;
  APP_PORT: number;
}

const schema = Joi.object<NotificationsEnv>({
  SQS_QUEUE_URL: Joi.string()
    .uri()
    .default('http://localhost:4566/000000000000/products-events'),
  SQS_ENDPOINT: Joi.string().uri().default('http://localhost:4566'),
  AWS_ACCESS_KEY_ID: Joi.string().default('test'),
  AWS_SECRET_ACCESS_KEY: Joi.string().default('test'),
  AWS_REGION: Joi.string().default('us-east-1'),
  NOTIFICATIONS_PORT: Joi.number().port().default(3001),
  APP_PORT: Joi.number().port().default(3001),
})
  .unknown(true)
  .required();

export function validateEnv(env: NodeJS.ProcessEnv): NotificationsEnv {
  const { value, error } = schema.validate(env, { abortEarly: false });
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }
  return value;
}

