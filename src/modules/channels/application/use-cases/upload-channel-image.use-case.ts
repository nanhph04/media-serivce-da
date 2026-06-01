import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { ChannelStatus } from '../../domain/entities/channel.entity';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import type { ChannelResponse } from '../dtos/channel.response';
import type {
  UploadChannelImageCommand,
  UploadChannelImageFile,
} from '../dtos/upload-channel-image.command';

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_BANNER_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_EXTENSIONS = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

@Injectable()
export class UploadChannelImageUseCase extends BaseUseCase<
  UploadChannelImageCommand,
  ChannelResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService: IObjectStorageService,
  ) {
    super();
  }

  async execute(command: UploadChannelImageCommand): Promise<ChannelResponse> {
    if (!command.file) {
      throw new BadRequestException(ERROR_MESSAGES.IMAGE_FILE_REQUIRED);
    }

    this.validateFileSize(command.file, command.imageType);
    const extension = this.resolveImageExtension(command.file);
    const channel = await this.channelRepository.findByUserId(command.userId);

    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    }

    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new ForbiddenException(ERROR_MESSAGES.CHANNEL_NOT_ACTIVE);
    }

    const previousImageUrl =
      command.imageType === 'avatar' ? channel.avatarUrl : channel.bannerUrl;
    const objectKey = `channels/${channel.id}/${command.imageType}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const imageUrl = await this.objectStorageService.uploadObject({
      bucket: 'public',
      objectKey,
      body: command.file.buffer,
      contentType: command.file.contentType,
      sizeBytes: command.file.sizeBytes,
    });

    if (command.imageType === 'avatar') {
      channel.update({ avatarUrl: imageUrl });
    } else {
      channel.update({ bannerUrl: imageUrl });
    }

    await this.channelRepository.update(channel);
    await this.deletePreviousImageIfNeeded(
      command.imageType,
      previousImageUrl,
      imageUrl,
    );

    return {
      id: channel.id,
      userId: channel.userId,
      name: channel.name,
      bio: channel.bio,
      isEligibleForMembership: channel.isEligibleForMembership,
      isMembershipClosedByAdmin: channel.isMembershipClosedByAdmin,
      membershipReviewStatus: channel.membershipReviewStatus,
      membershipRejectionReason: channel.membershipRejectionReason,
      membershipRequestedAt: channel.membershipRequestedAt,
      membershipReviewedAt: channel.membershipReviewedAt,
      avatarUrl: channel.avatarUrl,
      bannerUrl: channel.bannerUrl,
      status: channel.status,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }

  private validateFileSize(
    file: UploadChannelImageFile,
    imageType: UploadChannelImageCommand['imageType'],
  ): void {
    const maxSizeBytes =
      imageType === 'avatar' ? MAX_AVATAR_SIZE_BYTES : MAX_BANNER_SIZE_BYTES;

    if (file.sizeBytes <= 0) {
      throw new BadRequestException(ERROR_MESSAGES.IMAGE_FILE_EMPTY);
    }

    if (file.sizeBytes > maxSizeBytes) {
      throw new BadRequestException(ERROR_MESSAGES.IMAGE_FILE_EXCEEDS_MAX_SIZE);
    }
  }

  private resolveImageExtension(file: UploadChannelImageFile): string {
    const extension = SUPPORTED_IMAGE_EXTENSIONS.get(
      file.contentType.toLowerCase(),
    );

    if (!extension) {
      throw new BadRequestException(
        'Channel image must be a JPEG, PNG, or WebP file',
      );
    }

    return extension;
  }

  private async deletePreviousImageIfNeeded(
    imageType: UploadChannelImageCommand['imageType'],
    previousImageUrl: string,
    currentImageUrl: string,
  ): Promise<void> {
    if (!previousImageUrl || previousImageUrl === currentImageUrl) {
      return;
    }

    try {
      await this.objectStorageService.deleteObjectByUrl(
        'public',
        previousImageUrl,
      );
    } catch (error) {
      this.logger.logWarn('Failed to delete previous channel image', {
        imageType,
        previousImageUrl,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
