import type { IChannelMembershipRepository } from '../../domain/repositories/channel-membership.repository';
import { UnsubscribeChannelCommand } from '../dtos/subscribe-channel.command';
import type { ChannelMembershipResponse } from '../dtos/channel-membership.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';

export class UnsubscribeChannelUseCase extends BaseUseCase<
  UnsubscribeChannelCommand,
  ChannelMembershipResponse
> {
  constructor(
    private readonly membershipRepository: IChannelMembershipRepository,
  ) {
    super();
  }

  async execute(
    command: UnsubscribeChannelCommand,
  ): Promise<ChannelMembershipResponse> {
    const membership = await this.membershipRepository.findByUserIdAndChannelId(
      command.userId,
      command.channelId,
    );

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    if (!membership.isActive()) {
      throw new BadRequestException('Already unsubscribed from this channel');
    }

    membership.cancel();
    await this.membershipRepository.update(membership);

    return {
      id: membership.id,
      userId: membership.userId,
      channelId: membership.channelId,
      membershipId: membership.membershipId,
      expiryDate: membership.expiryDate,
      retryCount: membership.retryCount,
      status: membership.status,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  }
}
