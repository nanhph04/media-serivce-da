import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { LockChannelCommand } from '../dtos/lock-channel.command';
import { ChannelResponse } from '../dtos/channel.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';

export class AdminLockChannelUseCase extends BaseUseCase<
  LockChannelCommand,
  ChannelResponse
> {
  constructor(private readonly channelRepository: IChannelRepository) {
    super();
  }

  async execute(command: LockChannelCommand): Promise<ChannelResponse> {
    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (command.action === 'lock') {
      channel.suspend();
    } else if (command.action === 'unlock') {
      channel.restore();
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
      avatarUrl: channel.avatarUrl,
      bannerUrl: channel.bannerUrl,
      status: channel.status,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }
}
