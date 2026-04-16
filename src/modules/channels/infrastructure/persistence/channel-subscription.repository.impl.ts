import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Equal } from 'typeorm';
import { IChannelSubscriptionRepository } from '../../domain/repositories/channel-subscription.repository';
import {
  ChannelSubscriptionEntity,
  SubscriptionStatus,
} from '../../domain/entities/channel-subscription.entity';
import { ChannelSubscriptionOrmEntity } from '../persistence/channel-subscription.orm-entity';
import { ChannelSubscriptionMapper } from '../mappers/channel-subscription.mapper';

@Injectable()
export class ChannelSubscriptionRepositoryImpl implements IChannelSubscriptionRepository {
  constructor(
    @InjectRepository(ChannelSubscriptionOrmEntity)
    private readonly ormRepository: Repository<ChannelSubscriptionOrmEntity>,
    private readonly mapper: ChannelSubscriptionMapper,
  ) {}

  async create(subscription: ChannelSubscriptionEntity): Promise<void> {
    const ormEntity = this.mapper.toOrm(subscription);
    await this.ormRepository.save(ormEntity);
  }

  async update(subscription: ChannelSubscriptionEntity): Promise<void> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id: subscription.id },
    });
    if (!ormEntity) {
      throw new Error('Subscription not found');
    }
    const updatedEntity = this.mapper.toOrm(subscription, ormEntity);
    await this.ormRepository.save(updatedEntity);
  }

  async upsert(subscription: ChannelSubscriptionEntity): Promise<void> {
    const existing = await this.ormRepository.findOne({
      where: {
        userId: subscription.userId,
        channelId: subscription.channelId,
      },
    });

    if (!existing) {
      await this.create(subscription);
      return;
    }

    const updated = this.mapper.toOrm(subscription, existing);
    updated.id = existing.id;
    await this.ormRepository.save(updated);
  }

  async findById(id: string): Promise<ChannelSubscriptionEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id },
    });
    if (!ormEntity) {
      return null;
    }
    return this.mapper.toDomain(ormEntity);
  }

  async findByUserIdAndChannelId(
    userId: string,
    channelId: string,
  ): Promise<ChannelSubscriptionEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { userId, channelId },
    });
    if (!ormEntity) {
      return null;
    }
    return this.mapper.toDomain(ormEntity);
  }

  async findByChannelId(
    channelId: string,
  ): Promise<ChannelSubscriptionEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { channelId },
    });
    return ormEntities.map((ormEntity) => this.mapper.toDomain(ormEntity));
  }

  async findByUserId(userId: string): Promise<ChannelSubscriptionEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { userId },
    });
    return ormEntities.map((ormEntity) => this.mapper.toDomain(ormEntity));
  }

  async countByChannelId(channelId: string): Promise<number> {
    return this.ormRepository.count({
      where: { channelId, status: Equal(SubscriptionStatus.ACTIVE) },
    });
  }

  async findByUserIdAndChannelIdActive(
    userId: string,
    channelId: string,
  ): Promise<ChannelSubscriptionEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { userId, channelId, status: SubscriptionStatus.ACTIVE },
    });
    if (!ormEntity) {
      return null;
    }
    const domain = this.mapper.toDomain(ormEntity);
    return domain.isCurrentlyActive() ? domain : null;
  }
}
