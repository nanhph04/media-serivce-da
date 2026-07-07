import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VIDEO_QUERY_SERVICE,
  type IVideoQueryService,
} from '../../../videos/application/interfaces/video-query.service.interface';
import type { ChannelDetailResponse } from '../dtos/channel-detail.response';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import { ChannelStatus } from '../../domain/entities/channel.entity';
import {
  MEMBERSHIP_TIER_REPOSITORY,
  type IMembershipTierRepository,
} from '../../domain/repositories/membership-tier.repository';
import {
  CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE,
  type IChannelMembershipEligibilityService,
} from '../interfaces/channel-membership-eligibility.service.interface';
import {
  buildChannelAvatarUrl,
  buildChannelBannerUrl,
} from '../dtos/channel-image-url';

@Injectable()
export class GetChannelDetailUseCase extends BaseUseCase<
  { channelId: string; viewerUserId?: string | null },
  ChannelDetailResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
    @Inject(CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE)
    private readonly channelMembershipEligibilityService: IChannelMembershipEligibilityService,
    @Inject(VIDEO_QUERY_SERVICE)
    private readonly videoQueryService: IVideoQueryService,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService?: IObjectStorageService,
  ) {
    super();
  }

  async execute(command: {
    channelId: string;
    viewerUserId?: string | null;
  }): Promise<ChannelDetailResponse> {
    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    }

    if (channel.status !== ChannelStatus.ACTIVE) {
      if (command.viewerUserId === channel.userId) {
        throw new ForbiddenException(ERROR_MESSAGES.CHANNEL_NOT_ACTIVE);
      }

      throw new NotFoundException(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    }

    const membershipTiers = (
      await this.membershipTierRepository.findByChannelId(command.channelId)
    ).filter((tier) => tier.isAcceptingNew);

    const publicVideos =
      await this.videoQueryService.getPublicVideoSummariesByChannel(
        command.channelId,
      );
    const membershipEligibility =
      await this.channelMembershipEligibilityService.getChannelEligibility(
        command.channelId,
      );

    return {
      channel: {
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
      },
      membershipEligibility,
      membershipTiers: membershipTiers.map((tier) => ({
        id: tier.id,
        channelId: tier.channelId,
        name: tier.name,
        level: tier.level,
        priceCoin: tier.priceCoin,
        isAcceptingNew: tier.isAcceptingNew,
        createdAt: tier.createdAt,
        updatedAt: tier.updatedAt,
      })),
      publicVideos,
    };
  }
}
