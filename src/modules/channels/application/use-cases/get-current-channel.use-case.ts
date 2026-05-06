import { Inject, Injectable } from '@nestjs/common';
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
      throw new NotFoundException('Channel not found');
    }

    return {
      channelId: channel.id,
      userId: channel.userId,
      status: channel.status,
      isEligibleForMembership: channel.isEligibleForMembership,
      isMembershipClosedByAdmin: channel.isMembershipClosedByAdmin,
    };
  }
}
