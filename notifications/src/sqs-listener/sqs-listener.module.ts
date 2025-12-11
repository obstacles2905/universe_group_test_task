import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { MetricsModule } from '../metrics/metrics.module';
import { SqsListenerService } from './sqs-listener.service';

@Module({
  imports: [ConfigModule, MetricsModule],
  providers: [SqsListenerService],
})
export class SqsListenerModule {}

