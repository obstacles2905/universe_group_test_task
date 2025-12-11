import * as dotenv from 'dotenv';
import * as Joi from 'joi';

dotenv.config();

export interface ProductsEnv {
  DATABASE_URL?: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  SQS_QUEUE_URL: string;
  SQS_ENDPOINT: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  APP_PORT: number;
}

const schema = Joi.object<ProductsEnv>({
  DATABASE_URL: Joi.string().uri().optional(),
  POSTGRES_HOST: Joi.string().hostname().default('localhost'),
  POSTGRES_PORT: Joi.number().port().default(5433),
  POSTGRES_USER: Joi.string().default('postgres'),
  POSTGRES_PASSWORD: Joi.string().default('root'),
  POSTGRES_DB: Joi.string().default('db'),
  SQS_QUEUE_URL: Joi.string()
    .uri()
    .default('http://localhost:4566/000000000000/products-events'),
  SQS_ENDPOINT: Joi.string().uri().default('http://localhost:4566'),
  AWS_ACCESS_KEY_ID: Joi.string().default('test'),
  AWS_SECRET_ACCESS_KEY: Joi.string().default('test'),
  AWS_REGION: Joi.string().default('us-east-1'),
  APP_PORT: Joi.number().port().default(3000),
})
  .unknown(true)
  .required();

export function validateEnv(env: NodeJS.ProcessEnv): ProductsEnv {
  const { value, error } = schema.validate(env, { abortEarly: false });
  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }
  return value;
}

