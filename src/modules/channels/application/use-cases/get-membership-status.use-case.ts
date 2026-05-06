import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  CHANNEL_MEMBERSHIP_REPOSITORY,
  type IChannelMembershipRepository,
} from '../../domain/repositories/channel-membership.repository';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import {
  MEMBERSHIP_BLOCKED_REASON,
  type MembershipBlockedReason,
} from '../interfaces/membership-coin-compensation.publisher.interface';

interface GetMembershipStatusResponse {
  isActive: boolean;
  membershipId: string | null;
  expiryDate: Date | null;
  canRenew: boolean;
  canUpgrade: boolean;
  membershipBlockedReason: MembershipBlockedReason | null;
  isMembershipClosedByAdmin: boolean;
}

@Injectable()
export class GetMembershipStatusUseCase extends BaseUseCase<
  { channelId: string; userId: string },
  GetMembershipStatusResponse
> {
  constructor(
    @Inject(CHANNEL_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: IChannelMembershipRepository,
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
  ) {
    super();
  }

  async execute(command: {
    channelId: string;
    userId: string;
  }): Promise<GetMembershipStatusResponse> {
    const channel = await this.channelRepository.findById(command.channelId);
    const membership =
      await this.membershipRepository.findByUserIdAndChannelIdActive(
        command.userId,
        command.channelId,
      );
    const isMembershipClosedByAdmin =
      channel?.isMembershipClosedByAdmin ?? false;
    const membershipBlockedReason = isMembershipClosedByAdmin
      ? MEMBERSHIP_BLOCKED_REASON.ADMIN_CLOSED
      : null;

    return {
      isActive: membership?.isCurrentlyActive() ?? false,
      membershipId: membership?.membershipId ?? null,
      expiryDate: membership?.expiryDate ?? null,
      canRenew: !isMembershipClosedByAdmin && (membership?.isCurrentlyActive() ?? false),
      canUpgrade: !isMembershipClosedByAdmin && (membership?.isCurrentlyActive() ?? false),
      membershipBlockedReason,
      isMembershipClosedByAdmin,
    };
  }
}
