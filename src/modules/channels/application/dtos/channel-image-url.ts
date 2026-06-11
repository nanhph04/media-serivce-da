import type { IObjectStorageService } from '@shared/application/interfaces/object-storage.service.interface';
import type { ChannelEntity } from '../../domain/entities/channel.entity';

export function buildChannelAvatarUrl(
  channel: ChannelEntity,
  objectStorageService?: IObjectStorageService,
): string {
  return buildChannelImageUrl(
    channel.avatarObjectKey,
    channel.avatarUrl,
    objectStorageService,
  );
}

export function buildChannelBannerUrl(
  channel: ChannelEntity,
  objectStorageService?: IObjectStorageService,
): string {
  return buildChannelImageUrl(
    channel.bannerObjectKey,
    channel.bannerUrl,
    objectStorageService,
  );
}

export function buildChannelImageUrl(
  objectKey: string | null,
  fallbackUrl: string,
  objectStorageService?: IObjectStorageService,
): string {
  if (objectKey && objectStorageService) {
    return objectStorageService.createObjectUrl('public', objectKey);
  }

  return fallbackUrl;
}
