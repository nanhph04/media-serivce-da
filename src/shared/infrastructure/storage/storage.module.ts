import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { MinioService } from './minio.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [MinioService],
  exports: [MinioService],
})
export class StorageModule {}
