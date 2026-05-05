import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { MinioService } from './minio.service';
import { OBJECT_STORAGE_SERVICE } from '../../application/interfaces/object-storage.service.interface';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    MinioService,
    {
      provide: OBJECT_STORAGE_SERVICE,
      useExisting: MinioService,
    },
  ],
  exports: [MinioService, OBJECT_STORAGE_SERVICE],
})
export class StorageModule {}
