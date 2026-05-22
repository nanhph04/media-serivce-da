import {
  type VideoEntity,
  VideoThumbnailStatus,
} from '../../domain/entities/video.entity';

export function buildPublicThumbnailUrl(video: VideoEntity): string | null {
  if (!isThumbnailReady(video)) {
    return null;
  }

  return video.thumbnailUrl;
}

export function buildOwnerThumbnailUrl(video: VideoEntity): string | null {
  if (!isThumbnailReady(video)) {
    return null;
  }

  return video.thumbnailUrl;
}

function isThumbnailReady(video: VideoEntity): boolean {
  return (
    video.thumbnailStatus === VideoThumbnailStatus.READY &&
    video.thumbnailObjectKey !== null &&
    video.thumbnailUrl !== null
  );
}
