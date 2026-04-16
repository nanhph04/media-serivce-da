import { Repository } from 'typeorm';
import { VideoPurchaseUnlockEntity } from '../../domain/entities/video-purchase-unlock.entity';
import { VideoPurchaseUnlockOrmEntity } from './video-purchase-unlock.orm-entity';
export declare class VideoPurchaseUnlockRepository {
    private readonly ormRepository;
    constructor(ormRepository: Repository<VideoPurchaseUnlockOrmEntity>);
    save(unlock: VideoPurchaseUnlockEntity): Promise<void>;
    exists(videoId: string, userId: string): Promise<boolean>;
}
