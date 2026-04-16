import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoPurchaseUnlockEntity } from '../../domain/entities/video-purchase-unlock.entity';
import type { IVideoPurchaseUnlockRepository } from '../../domain/repositories/video-purchase-unlock.repository';
import { VideoPurchaseUnlockOrmEntity } from './video-purchase-unlock.orm-entity';

@Injectable()
export class VideoPurchaseUnlockRepository implements IVideoPurchaseUnlockRepository {
  constructor(
    @InjectRepository(VideoPurchaseUnlockOrmEntity)
    private readonly ormRepository: Repository<VideoPurchaseUnlockOrmEntity>,
  ) {}

  async save(unlock: VideoPurchaseUnlockEntity): Promise<void> {
    await this.ormRepository.save({
      id: unlock.id,
      videoId: unlock.videoId,
      userId: unlock.userId,
      createdAt: unlock.createdAt,
      updatedAt: unlock.updatedAt,
    });
  }

  async exists(videoId: string, userId: string): Promise<boolean> {
    return (
      (await this.ormRepository.count({
        where: { videoId, userId },
      })) > 0
    );
  }
}
