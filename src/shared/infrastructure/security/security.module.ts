import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { PlaybackTokenService } from './playback-token.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PlaybackTokenService],
  exports: [PlaybackTokenService],
})
export class SecurityModule {}
