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
import type { ChannelResponse } from '../dtos/channel.response';
import {
  buildChannelAvatarUrl,
  buildChannelBannerUrl,
} from '../dtos/channel-image-url';
import type { ReviewChannelMembershipCommand } from '../dtos/review-channel-membership.command';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';

@Injectable()
export class ReviewChannelMembershipUseCase extends BaseUseCase<
  ReviewChannelMembershipCommand,
  ChannelResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService?: IObjectStorageService,
  ) {
    super();
  }

  async execute(
    command: ReviewChannelMembershipCommand,
  ): Promise<ChannelResponse> {
    this.ensureNonEmpty(command.adminId, 'Admin id is required');
    this.ensureAdminRole(command.role);

    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    }

    if (command.action === 'approve') {
      channel.approveMembership(command.adminId);
    } else {
      channel.rejectMembership(command.adminId, command.reason ?? '');
    }

    await this.channelRepository.update(channel);

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
      avatarUrl: buildChannelAvatarUrl(channel, this.objectStorageService),
      bannerUrl: buildChannelBannerUrl(channel, this.objectStorageService),
      status: channel.status,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }

  private ensureNonEmpty(value: string, message: string): void {
    if (!value.trim()) {
      throw new BadRequestException(message);
    }
  }

  private ensureAdminRole(role: string | undefined): void {
    if (role !== 'admin') {
      throw new ForbiddenException(ERROR_MESSAGES.ADMIN_ROLE_REQUIRED);
    }
  }
}
