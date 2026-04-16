import { Inject, Injectable } from '@nestjs/common';
import { PlaybackTokenService } from '@shared/infrastructure/security/playback-token.service';
import { MinioService } from '@shared/infrastructure/storage/minio.service';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import type { Response } from 'express';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../videos/domain/repositories/video.repository';

@Injectable()
export class StreamingApplicationService {
  constructor(
    private readonly playbackTokenService: PlaybackTokenService,
    private readonly minioService: MinioService,
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {}

  async streamMasterPlaylist(videoId: string, token: string): Promise<string> {
    this.playbackTokenService.verifyToken(token, videoId);
    const video = await this.videoRepository.findById(videoId);
    if (!video || !video.masterPlaylistKey) {
      throw new NotFoundException('Video master playlist not found');
    }

    const playlist = await this.minioService.getObjectText(
      this.minioService.getProcessedBucket(),
      video.masterPlaylistKey,
    );

    return this.rewritePlaylist(videoId, token, playlist);
  }

  async pipeSegment(
    input: {
      videoId: string;
      token: string;
      segmentName: string;
    },
    response: Response,
  ): Promise<void> {
    this.playbackTokenService.verifyToken(input.token, input.videoId);
    const video = await this.videoRepository.findById(input.videoId);
    if (!video || !video.masterPlaylistKey) {
      throw new NotFoundException('Video master playlist not found');
    }

    const playlistDir = this.getPlaylistDirectory(video.masterPlaylistKey);
    const objectKey = `${playlistDir}/${input.segmentName}`.replace(/\\/g, '/');

    const stream = await this.minioService.getObjectStream(
      this.minioService.getProcessedBucket(),
      objectKey,
    );

    const contentType = input.segmentName.endsWith('.m3u8')
      ? 'application/vnd.apple.mpegurl'
      : 'video/mp2t';

    response.setHeader('Content-Type', contentType);

    await new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      response.on('close', resolve);
      stream.pipe(response);
    });
  }

  private rewritePlaylist(
    videoId: string,
    token: string,
    playlist: string,
  ): string {
    return playlist
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          return line;
        }

        if (trimmed.includes('://')) {
          throw new ForbiddenException(
            'External playlist URLs are not allowed',
          );
        }

        return `/api/media/stream/${videoId}/segments/${encodeURIComponent(trimmed)}?token=${token}`;
      })
      .join('\n');
  }

  private getPlaylistDirectory(masterPlaylistKey: string): string {
    const lastSlashIndex = masterPlaylistKey.lastIndexOf('/');
    if (lastSlashIndex < 0) {
      return '';
    }

    return masterPlaylistKey.slice(0, lastSlashIndex);
  }
}
