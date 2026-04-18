import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  CHANNEL_MEMBERSHIP_REPOSITORY,
  type IChannelMembershipRepository,
} from '../../domain/repositories/channel-membership.repository';

interface GetMembershipStatusResponse {
  isActive: boolean;
  membershipId: string | null;
  expiryDate: Date | null;
}

@Injectable()
export class GetMembershipStatusUseCase extends BaseUseCase<
  { channelId: string; userId: string },
  GetMembershipStatusResponse
> {
  constructor(
    @Inject(CHANNEL_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: IChannelMembershipRepository,
  ) {
    super();
  }

  async execute(command: {
    channelId: string;
    userId: string;
  }): Promise<GetMembershipStatusResponse> {
    const membership =
      await this.membershipRepository.findByUserIdAndChannelIdActive(
        command.userId,
        command.channelId,
      );

    return {
      isActive: membership?.isCurrentlyActive() ?? false,
      membershipId: membership?.membershipId ?? null,
      expiryDate: membership?.expiryDate ?? null,
    };
  }
}
