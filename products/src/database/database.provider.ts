import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '../config/config.service';

export const PG_POOL = Symbol('PG_POOL');

export const dbProvider: Provider = {
  provide: PG_POOL,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const pool = new Pool({
      connectionString: config.dbUrl,
    });

    pool.on('error', (err: Error) => {
      // eslint-disable-next-line no-console
      console.error('Unexpected PG error', err);
    });

    return pool;
  },
};

