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
import type { MembershipBlockedReason } from '../interfaces/membership-coin-compensation.publisher.interface';
import { resolveMembershipState } from '../services/membership-state.service';

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
    const state = resolveMembershipState({
      membership,
      isMembershipClosedByAdmin,
    });

    return {
      isActive: state.isActive,
      membershipId: membership?.membershipId ?? null,
      expiryDate: membership?.expiryDate ?? null,
      canRenew: state.canRenew,
      canUpgrade: state.canUpgrade,
      membershipBlockedReason: state.membershipBlockedReason,
      isMembershipClosedByAdmin,
    };
  }
}
