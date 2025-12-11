import { Injectable } from '@nestjs/common';
import { Counter, Registry, collectDefaultMetrics } from 'prom-client';
import { Response } from 'express';

@Injectable()
export class MetricsService {
  private readonly register: Registry;
  readonly productsCreated: Counter<string>;
  readonly productsDeleted: Counter<string>;

  constructor() {
    this.register = new Registry();
    collectDefaultMetrics({ register: this.register });

    this.productsCreated = new Counter({
      name: 'products_created_total',
      help: 'Number of products created',
      registers: [this.register],
    });

    this.productsDeleted = new Counter({
      name: 'products_deleted_total',
      help: 'Number of products deleted',
      registers: [this.register],
    });
  }

  async exportMetrics(res: Response) {
    res.setHeader('Content-Type', this.register.contentType);
    res.end(await this.register.metrics());
  }
}

