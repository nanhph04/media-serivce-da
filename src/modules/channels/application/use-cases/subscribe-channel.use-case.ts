import { IChannelSubscriptionRepository } from '../../domain/repositories/channel-subscription.repository';
import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { ChannelSubscriptionEntity } from '../../domain/entities/channel-subscription.entity';
import { SubscribeChannelCommand } from '../dtos/subscribe-channel.command';
import { ChannelSubscriptionResponse } from '../dtos/channel-subscription.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';

export class SubscribeChannelUseCase extends BaseUseCase<
  SubscribeChannelCommand,
  ChannelSubscriptionResponse
> {
  constructor(
    private readonly subscriptionRepository: IChannelSubscriptionRepository,
    private readonly channelRepository: IChannelRepository,
  ) {
    super();
  }

  async execute(
    command: SubscribeChannelCommand,
  ): Promise<ChannelSubscriptionResponse> {
    const channel = await this.channelRepository.findById(command.channelId);
    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.userId === command.userId) {
      throw new BadRequestException('Cannot subscribe to your own channel');
    }

    const existingSubscription =
      await this.subscriptionRepository.findByUserIdAndChannelId(
        command.userId,
        command.channelId,
      );

    if (existingSubscription) {
      if (existingSubscription.isActive()) {
        throw new BadRequestException('Already subscribed to this channel');
      }
      existingSubscription.reactivate();
      await this.subscriptionRepository.update(existingSubscription);
      return {
        id: existingSubscription.id,
        userId: existingSubscription.userId,
        channelId: existingSubscription.channelId,
        membershipId: existingSubscription.membershipId,
        expiryDate: existingSubscription.expiryDate,
        retryCount: existingSubscription.retryCount,
        status: existingSubscription.status,
        createdAt: existingSubscription.createdAt,
        updatedAt: existingSubscription.updatedAt,
      };
    }

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 1);
    const subscription = ChannelSubscriptionEntity.create({
      userId: command.userId,
      channelId: command.channelId,
      membershipId: command.membershipId,
      expiryDate: expiryDate,
    });

    await this.subscriptionRepository.create(subscription);

    return {
      id: subscription.id,
      userId: subscription.userId,
      channelId: subscription.channelId,
      membershipId: subscription.membershipId,
      expiryDate: subscription.expiryDate,
      retryCount: subscription.retryCount,
      status: subscription.status,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
