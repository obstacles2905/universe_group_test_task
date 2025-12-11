import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { MetricsModule } from './metrics/metrics.module';
import { SqsListenerModule } from './sqs-listener/sqs-listener.module';

@Module({
  imports: [ConfigModule, MetricsModule, SqsListenerModule],
})
export class AppModule {}

