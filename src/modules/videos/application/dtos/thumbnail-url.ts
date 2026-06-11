import type { IObjectStorageService } from '@shared/application/interfaces/object-storage.service.interface';
import {
  type VideoEntity,
  VideoThumbnailStatus,
} from '../../domain/entities/video.entity';

export function buildPublicThumbnailUrl(
  video: VideoEntity,
  objectStorageService?: IObjectStorageService,
): string | null {
  if (!isThumbnailReady(video)) {
    return null;
  }

  if (video.thumbnailObjectKey && objectStorageService) {
    return objectStorageService.createObjectUrl(
      'public',
      video.thumbnailObjectKey,
    );
  }

  return video.thumbnailUrl;
}

export function buildOwnerThumbnailUrl(
  video: VideoEntity,
  objectStorageService?: IObjectStorageService,
): string | null {
  if (!isThumbnailReady(video)) {
    return null;
  }

  if (video.thumbnailObjectKey && objectStorageService) {
    return objectStorageService.createObjectUrl(
      'public',
      video.thumbnailObjectKey,
    );
  }

  return video.thumbnailUrl;
}

function isThumbnailReady(video: VideoEntity): boolean {
  return (
    video.thumbnailStatus === VideoThumbnailStatus.READY &&
    (video.thumbnailObjectKey !== null || video.thumbnailUrl !== null)
  );
}
