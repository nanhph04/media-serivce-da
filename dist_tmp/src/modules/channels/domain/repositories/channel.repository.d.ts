import { ChannelEntity } from '../entities/channel.entity';
export declare const CHANNEL_REPOSITORY: unique symbol;
export interface IChannelRepository {
    create(channel: ChannelEntity): Promise<void>;
    update(channel: ChannelEntity): Promise<void>;
    delete(channel: ChannelEntity): Promise<void>;
    findById(id: string): Promise<ChannelEntity | null>;
    findByUserId(userId: string): Promise<ChannelEntity | null>;
}
