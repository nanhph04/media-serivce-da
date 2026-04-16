import { SubscriptionStatus } from '../../domain/entities/channel-subscription.entity';
export declare class ChannelSubscriptionOrmEntity {
    id: string;
    userId: string;
    channelId: string;
    membershipId: string;
    expiryDate: Date | null;
    retryCount: number;
    status: SubscriptionStatus;
    createdAt: Date;
    updatedAt: Date;
}
