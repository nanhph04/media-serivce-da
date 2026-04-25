import { Inject, Injectable } from '@nestjs/common';
import { PlaybackTokenService } from '@shared/infrastructure/security/playback-token.service';
import { MinioService } from '@shared/infrastructure/storage/minio.service';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import type { Response } from 'express';
import { RecordVideoViewUseCase } from '../../engagement/application/use-cases/record-video-view.use-case';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../videos/domain/repositories/video.repository';

@Injectable()
export class StreamingApplicationService {
  private readonly masterPlaylistKeyTtlSeconds: number;
  private readonly playlistCacheTtlSeconds: number;

  constructor(
    private readonly playbackTokenService: PlaybackTokenService,
    private readonly minioService: MinioService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    private readonly recordVideoViewUseCase: RecordVideoViewUseCase,
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {
    this.masterPlaylistKeyTtlSeconds = this.configService.getNumber(
      'STREAM_MASTER_PLAYLIST_KEY_CACHE_TTL_SECONDS',
      30,
    );
    this.playlistCacheTtlSeconds = this.configService.getNumber(
      'STREAM_REWRITTEN_PLAYLIST_CACHE_TTL_SECONDS',
      10,
    );
  }

  async streamMasterPlaylist(
    videoId: string,
    token: string | undefined,
  ): Promise<string> {
    const payload = this.playbackTokenService.verifyToken(token, videoId);
    const masterPlaylistKey = await this.getMasterPlaylistKeyOrThrow(videoId);
    const rewrittenPlaylist = await this.getRewrittenPlaylist({
      videoId,
      token: token ?? '',
      objectKey: masterPlaylistKey,
    });

    await this.recordVideoViewUseCase.execute({
      userId: payload.userId,
      videoId: payload.videoId,
    });

    return rewrittenPlaylist;
  }

  async pipeSegment(
    input: {
      videoId: string;
      token: string | undefined;
      segmentName: string;
    },
    response: Response,
  ): Promise<void> {
    this.playbackTokenService.verifyToken(input.token, input.videoId);
    const masterPlaylistKey = await this.getMasterPlaylistKeyOrThrow(
      input.videoId,
    );
    const playlistDir = this.getPlaylistDirectory(masterPlaylistKey);
    const objectKey = this.buildMediaObjectKey(playlistDir, input.segmentName);

    const contentType = input.segmentName.endsWith('.m3u8')
      ? 'application/vnd.apple.mpegurl'
      : 'video/mp2t';

    response.setHeader('Content-Type', contentType);

    if (input.segmentName.endsWith('.m3u8')) {
      response.send(
        await this.getRewrittenPlaylist({
          videoId: input.videoId,
          token: input.token ?? '',
          objectKey,
          currentPlaylistPath: input.segmentName,
        }),
      );
      return;
    }

    const stream = await this.getSegmentObjectStreamOrThrow({
      playlistDir,
      segmentName: input.segmentName,
      objectKey,
    });

    await new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      response.on('close', resolve);
      stream.pipe(response);
    });
  }

  private async getMasterPlaylistKeyOrThrow(videoId: string): Promise<string> {
    const cacheKey = this.getMasterPlaylistCacheKey(videoId);
    const cachedMasterPlaylistKey = await this.getCachedString(cacheKey);
    if (cachedMasterPlaylistKey) {
      return cachedMasterPlaylistKey;
    }

    const video = await this.videoRepository.findBasicById(videoId);
    if (!video || !video.masterPlaylistKey) {
      throw new NotFoundException('Video master playlist not found');
    }

    await this.setCachedString(
      cacheKey,
      video.masterPlaylistKey,
      this.masterPlaylistKeyTtlSeconds,
    );

    return video.masterPlaylistKey;
  }

  private async getRewrittenPlaylist(input: {
    videoId: string;
    token: string;
    objectKey: string;
    currentPlaylistPath?: string;
  }): Promise<string> {
    const cacheKey = this.getPlaylistCacheKey(
      input.videoId,
      input.token,
      input.objectKey,
    );
    const cachedPlaylist = await this.getCachedString(cacheKey);
    if (cachedPlaylist) {
      return cachedPlaylist;
    }

    const playlist = await this.getObjectTextOrThrow(input.objectKey);
    const rewrittenPlaylist = this.rewritePlaylist({
      videoId: input.videoId,
      token: input.token,
      playlist,
      currentPlaylistPath: input.currentPlaylistPath,
    });

    await this.setCachedString(
      cacheKey,
      rewrittenPlaylist,
      this.playlistCacheTtlSeconds,
    );

    return rewrittenPlaylist;
  }

  private rewritePlaylist(input: {
    videoId: string;
    token: string;
    playlist: string;
    currentPlaylistPath?: string;
  }): string {
    const playlistBasePath = this.getPlaylistDirectory(
      input.currentPlaylistPath ?? '',
    );

    return input.playlist
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

        let resolvedPath = this.resolvePlaylistReference(
          playlistBasePath,
          trimmed,
        );

        if (this.shouldUseSharedSegmentDirectory(playlistBasePath, trimmed)) {
          resolvedPath = this.resolvePlaylistReference('segments', trimmed);
        }

        return `/api/media/stream/${input.videoId}/segments/${encodeURIComponent(resolvedPath)}?token=${input.token}`;
      })
      .join('\n');
  }

  private buildMediaObjectKey(
    playlistDir: string,
    segmentName: string,
  ): string {
    return `${playlistDir}/${segmentName}`.replace(/\\/g, '/');
  }

  private shouldUseSharedSegmentDirectory(
    playlistBasePath: string,
    reference: string,
  ): boolean {
    return (
      playlistBasePath === '' &&
      !reference.includes('/') &&
      this.isMediaSegmentReference(reference)
    );
  }

  private isMediaSegmentReference(reference: string): boolean {
    const normalizedReference = reference.toLowerCase();

    return (
      normalizedReference.endsWith('.ts') ||
      normalizedReference.endsWith('.m4s') ||
      normalizedReference.endsWith('.mp4')
    );
  }

  private resolvePlaylistReference(basePath: string, reference: string): string {
    if (reference.startsWith('/')) {
      throw new ForbiddenException('Absolute playlist paths are not allowed');
    }

    const parts = [...basePath.split('/'), ...reference.split('/')];
    const resolvedParts: string[] = [];

    for (const part of parts) {
      if (!part || part === '.') {
        continue;
      }

      if (part === '..') {
        if (resolvedParts.length === 0) {
          throw new ForbiddenException(
            'Playlist paths cannot escape the video directory',
          );
        }
        resolvedParts.pop();
        continue;
      }

      resolvedParts.push(part);
    }

    return resolvedParts.join('/');
  }

  private async getObjectTextOrThrow(objectKey: string): Promise<string> {
    try {
      return await this.minioService.getObjectText(
        this.minioService.getProcessedBucket(),
        objectKey,
      );
    } catch (error: unknown) {
      this.throwIfMissingObject(error, objectKey);
      throw error;
    }
  }

  private getMasterPlaylistCacheKey(videoId: string): string {
    return `media_service:stream:video:${videoId}:master-playlist-key`;
  }

  private getPlaylistCacheKey(
    videoId: string,
    token: string,
    objectKey: string,
  ): string {
    return `media_service:stream:video:${videoId}:playlist:${encodeURIComponent(objectKey)}:token:${encodeURIComponent(token)}`;
  }

  private async getCachedString(key: string): Promise<string | null> {
    try {
      const value = await this.cacheService.get<string>(key);
      return typeof value === 'string' && value.length > 0 ? value : null;
    } catch {
      return null;
    }
  }

  private async setCachedString(
    key: string,
    value: string,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      await this.cacheService.set(key, value, ttlSeconds);
    } catch {
      // Cache write failure must not fail streaming.
    }
  }

  private async getSegmentObjectStreamOrThrow(input: {
    playlistDir: string;
    segmentName: string;
    objectKey: string;
  }): Promise<NodeJS.ReadableStream> {
    try {
      return await this.minioService.getObjectStream(
        this.minioService.getProcessedBucket(),
        input.objectKey,
      );
    } catch (error: unknown) {
      if (!this.isMissingObjectError(error)) {
        throw error;
      }

      return this.getFallbackObjectStreamOrThrow({
        playlistDir: input.playlistDir,
        segmentName: input.segmentName,
        attemptedObjectKey: input.objectKey,
      });
    }
  }

  private async getFallbackObjectStreamOrThrow(input: {
    playlistDir: string;
    segmentName: string;
    attemptedObjectKey: string;
  }): Promise<NodeJS.ReadableStream> {
    if (
      input.segmentName.includes('/') ||
      !this.isMediaSegmentReference(input.segmentName)
    ) {
      throw new NotFoundException(
        `Media object not found: ${input.attemptedObjectKey}`,
      );
    }

    const fallbackObjectKey = this.buildMediaObjectKey(
      input.playlistDir,
      `segments/${input.segmentName}`,
    );

    try {
      return await this.minioService.getObjectStream(
        this.minioService.getProcessedBucket(),
        fallbackObjectKey,
      );
    } catch (error: unknown) {
      this.throwIfMissingObject(error, fallbackObjectKey);
      throw error;
    }
  }

  private throwIfMissingObject(error: unknown, objectKey: string): void {
    if (!this.isMissingObjectError(error)) {
      return;
    }

    throw new NotFoundException(`Media object not found: ${objectKey}`);
  }

  private isMissingObjectError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const errorWithCode = error as Error & { code?: unknown };

    return (
      errorWithCode.code === 'NoSuchKey' ||
      error.message === 'The specified key does not exist.'
    );
  }

  private getPlaylistDirectory(masterPlaylistKey: string): string {
    const lastSlashIndex = masterPlaylistKey.lastIndexOf('/');
    if (lastSlashIndex < 0) {
      return '';
    }

    return masterPlaylistKey.slice(0, lastSlashIndex);
  }
}
