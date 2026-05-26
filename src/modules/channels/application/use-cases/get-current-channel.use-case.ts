import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import type { CurrentChannelResponse } from '../dtos/current-channel.response';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';

@Injectable()
export class GetCurrentChannelUseCase extends BaseUseCase<
  { userId: string },
  CurrentChannelResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
  ) {
    super();
  }

  async execute(command: { userId: string }): Promise<CurrentChannelResponse> {
    const channel = await this.channelRepository.findByUserId(command.userId);

    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    }

    return {
      channelId: channel.id,
      userId: channel.userId,
      status: channel.status,
      isEligibleForMembership: channel.isEligibleForMembership,
      isMembershipClosedByAdmin: channel.isMembershipClosedByAdmin,
      membershipReviewStatus: channel.membershipReviewStatus,
      membershipRejectionReason: channel.membershipRejectionReason,
      membershipRequestedAt: channel.membershipRequestedAt,
      membershipReviewedAt: channel.membershipReviewedAt,
    };
  }
}
