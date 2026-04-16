import { IChannelSubscriptionRepository } from '../../domain/repositories/channel-subscription.repository';
import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { SubscribeChannelCommand } from '../dtos/subscribe-channel.command';
import { ChannelSubscriptionResponse } from '../dtos/channel-subscription.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
export declare class SubscribeChannelUseCase extends BaseUseCase<SubscribeChannelCommand, ChannelSubscriptionResponse> {
    private readonly subscriptionRepository;
    private readonly channelRepository;
    constructor(subscriptionRepository: IChannelSubscriptionRepository, channelRepository: IChannelRepository);
    execute(command: SubscribeChannelCommand): Promise<ChannelSubscriptionResponse>;
}
