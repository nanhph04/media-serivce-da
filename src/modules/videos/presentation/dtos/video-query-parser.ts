import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';

export function parseVideoLimit(limit?: string): number {
  const parsed = Number(limit) || 20;
  return Math.min(Math.max(parsed, 1), 50);
}

export function parseVideoPage(page?: string): number {
  const parsed = Number(page) || 1;
  return Math.max(parsed, 1);
}

export function parseVideoTags(tags?: string): string[] | undefined {
  if (!tags) {
    return undefined;
  }

  const normalizedTags = [
    ...new Set(
      tags
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ];

  return normalizedTags.length > 0 ? normalizedTags : undefined;
}

export function parseVideoStatuses(status?: string): VideoStatus[] | undefined {
  if (!status) {
    return undefined;
  }

  return status
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is VideoStatus =>
      Object.values(VideoStatus).includes(value as VideoStatus),
    );
}

export function parseVideoVisibilities(
  visibility?: string,
): VideoVisibility[] | undefined {
  if (!visibility) {
    return undefined;
  }

  return visibility
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is VideoVisibility =>
      Object.values(VideoVisibility).includes(value as VideoVisibility),
    );
}
