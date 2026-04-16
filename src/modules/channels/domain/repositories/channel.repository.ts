import { ChannelEntity } from '../entities/channel.entity';

export const CHANNEL_REPOSITORY = Symbol('CHANNEL_REPOSITORY');

export interface IChannelRepository {
  create(channel: ChannelEntity): Promise<void>;
  update(channel: ChannelEntity): Promise<void>;
  delete(channel: ChannelEntity): Promise<void>;
  findById(id: string): Promise<ChannelEntity | null>;
  findByUserId(userId: string): Promise<ChannelEntity | null>;
}
