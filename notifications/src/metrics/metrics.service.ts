import { Injectable } from '@nestjs/common';
import { Counter, Registry, collectDefaultMetrics } from 'prom-client';
import { Response } from 'express';

@Injectable()
export class MetricsService {
  private readonly register: Registry;
  readonly messagesConsumed: Counter<string>;

  constructor() {
    this.register = new Registry();
    collectDefaultMetrics({ register: this.register });

    this.messagesConsumed = new Counter({
      name: 'notification_messages_consumed_total',
      help: 'Number of SQS messages processed',
      registers: [this.register],
    });
  }

  /**
   * Exports Prometheus metrics in the standard format.
   *
   * @param res - Express response object to write metrics to
   */
  async exportMetrics(res: Response) {
    res.setHeader('Content-Type', this.register.contentType);
    res.end(await this.register.metrics());
  }

  /**
   * Gets the Prometheus metrics registry.
   *
   * @returns Prometheus Registry instance
   */
  getMetrics() {
    return this.register;
  }
}

