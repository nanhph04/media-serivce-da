import type { IChannelMembershipRepository } from '../../domain/repositories/channel-membership.repository';
import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';
import { SubscribeChannelCommand } from '../dtos/subscribe-channel.command';
import type { ChannelMembershipResponse } from '../dtos/channel-membership.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';

export class SubscribeChannelUseCase extends BaseUseCase<
  SubscribeChannelCommand,
  ChannelMembershipResponse
> {
  constructor(
    private readonly membershipRepository: IChannelMembershipRepository,
    private readonly channelRepository: IChannelRepository,
  ) {
    super();
  }

  async execute(
    command: SubscribeChannelCommand,
  ): Promise<ChannelMembershipResponse> {
    const channel = await this.channelRepository.findById(command.channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.userId === command.userId) {
      throw new BadRequestException('Cannot subscribe to your own channel');
    }

    const existingSubscription =
      await this.membershipRepository.findByUserIdAndChannelId(
        command.userId,
        command.channelId,
      );

    if (existingSubscription) {
      if (existingSubscription.isActive()) {
        throw new BadRequestException('Already subscribed to this channel');
      }
      existingSubscription.reactivate();
      await this.membershipRepository.update(existingSubscription);
      return {
        id: existingSubscription.id,
        userId: existingSubscription.userId,
        channelId: existingSubscription.channelId,
        membershipId: existingSubscription.membershipId,
        expiryDate: existingSubscription.expiryDate,
        retryCount: existingSubscription.retryCount,
        status: existingSubscription.status,
        autoRenewEnabled: existingSubscription.autoRenewEnabled,
        renewalStatus: existingSubscription.renewalStatus,
        renewalReminderSentAt: existingSubscription.renewalReminderSentAt,
        lastRenewalAttemptAt: existingSubscription.lastRenewalAttemptAt,
        nextRenewalAttemptAt: existingSubscription.nextRenewalAttemptAt,
        createdAt: existingSubscription.createdAt,
        updatedAt: existingSubscription.updatedAt,
      };
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    const membership = ChannelMembershipEntity.create({
      userId: command.userId,
      channelId: command.channelId,
      membershipId: command.membershipId,
      expiryDate: expiryDate,
    });

    await this.membershipRepository.create(membership);

    return {
      id: membership.id,
      userId: membership.userId,
      channelId: membership.channelId,
      membershipId: membership.membershipId,
      expiryDate: membership.expiryDate,
      retryCount: membership.retryCount,
      status: membership.status,
      autoRenewEnabled: membership.autoRenewEnabled,
      renewalStatus: membership.renewalStatus,
      renewalReminderSentAt: membership.renewalReminderSentAt,
      lastRenewalAttemptAt: membership.lastRenewalAttemptAt,
      nextRenewalAttemptAt: membership.nextRenewalAttemptAt,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  }
}
