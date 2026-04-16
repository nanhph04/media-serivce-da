import { ChannelStatus } from '../../domain/entities/channel.entity';
export declare class ChannelOrmEntity {
    id: string;
    userId: string;
    name: string;
    bio: string;
    avatarUrl: string;
    bannerUrl: string;
    status: ChannelStatus;
    isEligibleForMembership: boolean;
    createdAt: Date;
    updatedAt: Date;
}
