import { Repository } from 'typeorm';
import { VideoEntity } from '../../domain/entities/video.entity';
import { VideoOrmEntity } from './video.orm-entity';
export declare class VideoRepository {
    private readonly ormRepository;
    constructor(ormRepository: Repository<VideoOrmEntity>);
    save(video: VideoEntity): Promise<void>;
    findById(id: string): Promise<VideoEntity | null>;
    findPublicByChannelId(channelId: string): Promise<VideoEntity[]>;
    findLatestPublic(limit: number): Promise<VideoEntity[]>;
    findByCategory(category: string, limit: number): Promise<VideoEntity[]>;
    findByChannelIds(channelIds: string[], limit: number): Promise<VideoEntity[]>;
    private toDomain;
}
