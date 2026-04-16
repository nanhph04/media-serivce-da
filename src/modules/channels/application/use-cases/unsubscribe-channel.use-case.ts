import { IChannelSubscriptionRepository } from '../../domain/repositories/channel-subscription.repository';
import { UnsubscribeChannelCommand } from '../dtos/subscribe-channel.command';
import { ChannelSubscriptionResponse } from '../dtos/channel-subscription.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';

export class UnsubscribeChannelUseCase extends BaseUseCase<
  UnsubscribeChannelCommand,
  ChannelSubscriptionResponse
> {
  constructor(
    private readonly subscriptionRepository: IChannelSubscriptionRepository,
  ) {
    super();
  }

  async execute(
    command: UnsubscribeChannelCommand,
  ): Promise<ChannelSubscriptionResponse> {
    const subscription =
      await this.subscriptionRepository.findByUserIdAndChannelId(
        command.userId,
        command.channelId,
      );

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.isActive()) {
      throw new BadRequestException('Already unsubscribed from this channel');
    }

    subscription.cancel();
    await this.subscriptionRepository.update(subscription);

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
