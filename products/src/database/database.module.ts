import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { dbProvider } from './database.provider';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DatabaseModule {}

