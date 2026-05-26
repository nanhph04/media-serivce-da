import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { ChannelStatus } from '../../domain/entities/channel.entity';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import type { ChannelResponse } from '../dtos/channel.response';
import {
  CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE,
  type IChannelMembershipEligibilityService,
} from '../interfaces/channel-membership-eligibility.service.interface';

export interface RequestChannelMembershipReviewCommand {
  channelId: string;
  userId: string;
}

@Injectable()
export class RequestChannelMembershipReviewUseCase extends BaseUseCase<
  RequestChannelMembershipReviewCommand,
  ChannelResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE)
    private readonly channelMembershipEligibilityService: IChannelMembershipEligibilityService,
  ) {
    super();
  }

  async execute(
    command: RequestChannelMembershipReviewCommand,
  ): Promise<ChannelResponse> {
    await this.ensureChannelCanRequestMembershipReview(command);

    const eligibility =
      await this.channelMembershipEligibilityService.syncChannelEligibility(
        command.channelId,
      );

    if (!eligibility.isEligible) {
      throw new ForbiddenException(
        ERROR_MESSAGES.CHANNEL_NOT_ELIGIBLE_TO_OPEN_MEMBERSHIP,
        eligibility.missingRequirements,
      );
    }

    const channel = await this.channelRepository.findById(command.channelId);
    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    }

    channel.requestMembershipReview();
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
      avatarUrl: channel.avatarUrl,
      bannerUrl: channel.bannerUrl,
      status: channel.status,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }

  private async ensureChannelCanRequestMembershipReview(
    command: RequestChannelMembershipReviewCommand,
  ): Promise<void> {
    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    }

    if (channel.userId !== command.userId) {
      throw new ForbiddenException(ERROR_MESSAGES.CHANNEL_NOT_OWNED);
    }

    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new ForbiddenException(ERROR_MESSAGES.CHANNEL_NOT_ACTIVE);
    }

    if (channel.isMembershipClosedByAdmin) {
      throw new ForbiddenException(
        ERROR_MESSAGES.CHANNEL_MEMBERSHIP_REGISTRATION_CLOSED,
      );
    }
  }
}
