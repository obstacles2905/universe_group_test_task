import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { MetricsModule } from './metrics/metrics.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule,
    MetricsModule,
    DatabaseModule,
    NotificationsModule,
    ProductsModule,
  ],
})
export class AppModule {}

