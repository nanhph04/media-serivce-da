import {
  type VideoEntity,
  VideoThumbnailStatus,
} from '../../domain/entities/video.entity';

export function buildPublicThumbnailUrl(video: VideoEntity): string | null {
  if (!isThumbnailReady(video)) {
    return null;
  }

  return `/api/media/videos/${video.id}/thumbnail`;
}

export function buildOwnerThumbnailUrl(video: VideoEntity): string | null {
  if (!isThumbnailReady(video)) {
    return null;
  }

  return `/api/media/studio/videos/${video.id}/thumbnail`;
}

function isThumbnailReady(video: VideoEntity): boolean {
  return (
    video.thumbnailStatus === VideoThumbnailStatus.READY &&
    video.thumbnailObjectKey !== null
  );
}
