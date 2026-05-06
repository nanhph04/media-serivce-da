import { Inject, Injectable } from '@nestjs/common';
import {
  PLAYBACK_TOKEN_VERIFIER,
  type IPlaybackTokenVerifier,
} from '@shared/application/interfaces/playback-token.service.interface';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import {
  TEXT_CACHE,
  type ITextCache,
} from '@shared/application/interfaces/cache-store.interface';
import {
  STREAM_CONFIG,
  type IStreamConfig,
} from '@shared/application/interfaces/stream-config.interface';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../../videos/domain/repositories/video.repository';
import { StreamingUseCaseBase } from './streaming.use-case.base';

@Injectable()
export class GetStreamMasterPlaylistUseCase extends StreamingUseCaseBase {
  constructor(
    @Inject(PLAYBACK_TOKEN_VERIFIER)
    playbackTokenVerifier: IPlaybackTokenVerifier,
    @Inject(OBJECT_STORAGE_SERVICE)
    objectStorageService: IObjectStorageService,
    @Inject(TEXT_CACHE)
    textCache: ITextCache,
    @Inject(STREAM_CONFIG)
    streamConfig: IStreamConfig,
    @Inject(VIDEO_REPOSITORY)
    videoRepository: IVideoRepository,
  ) {
    super(
      playbackTokenVerifier,
      objectStorageService,
      textCache,
      streamConfig,
      videoRepository,
    );
  }

  async execute(input: {
    videoId: string;
    token: string | undefined;
  }): Promise<string> {
    this.verifyToken(input.videoId, input.token);
    const masterPlaylistKey = await this.getMasterPlaylistKeyOrThrow(
      input.videoId,
    );
    return this.getRewrittenPlaylist({
      videoId: input.videoId,
      token: input.token ?? '',
      objectKey: masterPlaylistKey,
    });
  }
}
