import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import type { IStreamConfig } from '@shared/application/interfaces/stream-config.interface';
import type { ITextCache } from '@shared/application/interfaces/cache-store.interface';
import type {
  IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import type { IPlaybackTokenVerifier } from '@shared/application/interfaces/playback-token.service.interface';
import type { IVideoRepository } from '../../../videos/domain/repositories/video.repository';

export abstract class StreamingUseCaseBase {
  protected constructor(
    protected readonly playbackTokenVerifier: IPlaybackTokenVerifier,
    protected readonly objectStorageService: IObjectStorageService,
    protected readonly textCache: ITextCache,
    protected readonly streamConfig: IStreamConfig,
    protected readonly videoRepository: IVideoRepository,
  ) {}

  protected verifyToken(
    videoId: string,
    token: string | undefined,
  ): { userId: string; videoId: string; channelId: string } {
    return this.playbackTokenVerifier.verifyToken(token, videoId);
  }

  protected async getMasterPlaylistKeyOrThrow(videoId: string): Promise<string> {
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
      this.streamConfig.getMasterPlaylistKeyCacheTtlSeconds(),
    );

    return video.masterPlaylistKey;
  }

  protected async getRewrittenPlaylist(input: {
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
      this.streamConfig.getRewrittenPlaylistCacheTtlSeconds(),
    );

    return rewrittenPlaylist;
  }

  protected rewritePlaylist(input: {
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
          throw new ForbiddenException('External playlist URLs are not allowed');
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

  protected buildMediaObjectKey(
    playlistDir: string,
    segmentName: string,
  ): string {
    return `${playlistDir}/${segmentName}`.replace(/\\/g, '/');
  }

  protected async getSegmentObjectStreamOrThrow(input: {
    playlistDir: string;
    segmentName: string;
    objectKey: string;
  }): Promise<NodeJS.ReadableStream> {
    try {
      return await this.objectStorageService.getObjectStream(
        'processed',
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

  protected async getObjectTextOrThrow(objectKey: string): Promise<string> {
    try {
      return await this.objectStorageService.getObjectText(
        'processed',
        objectKey,
      );
    } catch (error: unknown) {
      this.throwIfMissingObject(error, objectKey);
      throw error;
    }
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
      const value = await this.textCache.get(key);
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
      await this.textCache.set(key, value, ttlSeconds);
    } catch {
      // Cache write failure must not fail streaming.
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
      return await this.objectStorageService.getObjectStream(
        'processed',
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

  protected getPlaylistDirectory(masterPlaylistKey: string): string {
    const lastSlashIndex = masterPlaylistKey.lastIndexOf('/');
    if (lastSlashIndex < 0) {
      return '';
    }

    return masterPlaylistKey.slice(0, lastSlashIndex);
  }
}
