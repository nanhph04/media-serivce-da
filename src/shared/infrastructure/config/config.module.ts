import { Module, Global } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigService } from './config.service';
import { STREAM_CONFIG } from '../../application/interfaces/stream-config.interface';
import { VIDEO_UPLOAD_CONFIG } from '../../application/interfaces/video-upload-config.interface';
import { VIDEO_VIEW_CONFIG } from '../../application/interfaces/video-view-config.interface';

@Global()
@Module({
  imports: [NestConfigModule.forRoot()],
  providers: [
    ConfigService,
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
    STREAM_CONFIG,
    VIDEO_UPLOAD_CONFIG,
    VIDEO_VIEW_CONFIG,
  ],
})
export class ConfigModule {}
