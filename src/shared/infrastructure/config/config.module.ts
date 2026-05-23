import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { IInternalServiceConfig } from '../../application/interfaces/internal-service-config.interface';
import { ConfigService } from './config.service';
import { InternalServiceConfigService } from './internal-service-config.service';
import { STREAM_CONFIG } from '../../application/interfaces/stream-config.interface';
import { VIDEO_UPLOAD_CONFIG } from '../../application/interfaces/video-upload-config.interface';
import { VIDEO_VIEW_CONFIG } from '../../application/interfaces/video-view-config.interface';

@Global()
@Module({
  imports: [NestConfigModule.forRoot()],
  providers: [
    ConfigService,
    InternalServiceConfigService,
    {
      provide: IInternalServiceConfig,
      useExisting: InternalServiceConfigService,
    },
    {
      provide: STREAM_CONFIG,
      useExisting: ConfigService,
    },
    {
      provide: VIDEO_VIEW_CONFIG,
      useExisting: ConfigService,
    },
    {
      provide: VIDEO_UPLOAD_CONFIG,
      useExisting: ConfigService,
    },
  ],
  exports: [
    ConfigService,
    IInternalServiceConfig,
    STREAM_CONFIG,
    VIDEO_UPLOAD_CONFIG,
    VIDEO_VIEW_CONFIG,
  ],
})
export class ConfigModule {}
