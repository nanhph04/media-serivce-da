import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { PlaybackTokenService } from './playback-token.service';
import {
  PLAYBACK_TOKEN_ISSUER,
  PLAYBACK_TOKEN_VERIFIER,
} from '../../application/interfaces/playback-token.service.interface';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    PlaybackTokenService,
    {
      provide: PLAYBACK_TOKEN_ISSUER,
      useExisting: PlaybackTokenService,
    },
    {
      provide: PLAYBACK_TOKEN_VERIFIER,
      useExisting: PlaybackTokenService,
    },
  ],
  exports: [
    PlaybackTokenService,
    PLAYBACK_TOKEN_ISSUER,
    PLAYBACK_TOKEN_VERIFIER,
  ],
})
export class SecurityModule {}
