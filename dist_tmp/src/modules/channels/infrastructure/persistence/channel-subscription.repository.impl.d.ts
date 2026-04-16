import { Repository } from 'typeorm';
import { IChannelSubscriptionRepository } from '../../domain/repositories/channel-subscription.repository';
import { ChannelSubscriptionEntity } from '../../domain/entities/channel-subscription.entity';
import { ChannelSubscriptionOrmEntity } from '../persistence/channel-subscription.orm-entity';
import { ChannelSubscriptionMapper } from '../mappers/channel-subscription.mapper';
export declare class ChannelSubscriptionRepositoryImpl implements IChannelSubscriptionRepository {
    private readonly ormRepository;
    private readonly mapper;
    constructor(ormRepository: Repository<ChannelSubscriptionOrmEntity>, mapper: ChannelSubscriptionMapper);
    create(subscription: ChannelSubscriptionEntity): Promise<void>;
    update(subscription: ChannelSubscriptionEntity): Promise<void>;
    upsert(subscription: ChannelSubscriptionEntity): Promise<void>;
    findById(id: string): Promise<ChannelSubscriptionEntity | null>;
    findByUserIdAndChannelId(userId: string, channelId: string): Promise<ChannelSubscriptionEntity | null>;
    findByChannelId(channelId: string): Promise<ChannelSubscriptionEntity[]>;
    findByUserId(userId: string): Promise<ChannelSubscriptionEntity[]>;
    countByChannelId(channelId: string): Promise<number>;
    findByUserIdAndChannelIdActive(userId: string, channelId: string): Promise<ChannelSubscriptionEntity | null>;
}
