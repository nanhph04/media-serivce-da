import { Repository } from 'typeorm';
import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { ChannelEntity } from '../../domain/entities/channel.entity';
import { ChannelOrmEntity } from './channel.orm-entity';
export declare class ChannelRepositoryImpl implements IChannelRepository {
    private readonly ormRepository;
    constructor(ormRepository: Repository<ChannelOrmEntity>);
    create(channel: ChannelEntity): Promise<void>;
    update(channel: ChannelEntity): Promise<void>;
    delete(channel: ChannelEntity): Promise<void>;
    findById(id: string): Promise<ChannelEntity | null>;
    findByUserId(userId: string): Promise<ChannelEntity | null>;
}
