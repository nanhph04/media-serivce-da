import { IChannelSubscriptionRepository } from '../../domain/repositories/channel-subscription.repository';
import { UnsubscribeChannelCommand } from '../dtos/subscribe-channel.command';
import { ChannelSubscriptionResponse } from '../dtos/channel-subscription.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
export declare class UnsubscribeChannelUseCase extends BaseUseCase<UnsubscribeChannelCommand, ChannelSubscriptionResponse> {
    private readonly subscriptionRepository;
    constructor(subscriptionRepository: IChannelSubscriptionRepository);
    execute(command: UnsubscribeChannelCommand): Promise<ChannelSubscriptionResponse>;
}
