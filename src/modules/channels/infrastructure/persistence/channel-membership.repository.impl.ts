import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';
import type { IChannelMembershipRepository } from '../../domain/repositories/channel-membership.repository';
import {
  ChannelMembershipEntity,
  ChannelMembershipStatus,
} from '../../domain/entities/channel-membership.entity';
import { ChannelMembershipOrmEntity } from './channel-membership.orm-entity';
import { ChannelMembershipMapper } from '../mappers/channel-membership.mapper';

@Injectable()
export class ChannelMembershipRepositoryImpl implements IChannelMembershipRepository {
  constructor(
    @InjectRepository(ChannelMembershipOrmEntity)
    private readonly ormRepository: Repository<ChannelMembershipOrmEntity>,
    private readonly mapper: ChannelMembershipMapper,
  ) {}

  async create(membership: ChannelMembershipEntity): Promise<void> {
    const ormEntity = this.mapper.toOrm(membership);
    await this.ormRepository.save(ormEntity);
  }

  async update(membership: ChannelMembershipEntity): Promise<void> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id: membership.id },
    });
    if (!ormEntity) {
      throw new Error('Membership not found');
    }
    const updatedEntity = this.mapper.toOrm(membership, ormEntity);
    await this.ormRepository.save(updatedEntity);
  }

  async upsert(membership: ChannelMembershipEntity): Promise<void> {
    const existing = await this.ormRepository.findOne({
      where: {
        userId: membership.userId,
        channelId: membership.channelId,
      },
    });

    if (!existing) {
      await this.create(membership);
      return;
    }

    const updated = this.mapper.toOrm(membership, existing);
    updated.id = existing.id;
    await this.ormRepository.save(updated);
  }

  async findById(id: string): Promise<ChannelMembershipEntity | null> {
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
  ): Promise<ChannelMembershipEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { userId, channelId },
    });
    if (!ormEntity) {
      return null;
    }
    return this.mapper.toDomain(ormEntity);
  }

  async findByChannelId(channelId: string): Promise<ChannelMembershipEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { channelId },
    });
    return ormEntities.map((ormEntity) => this.mapper.toDomain(ormEntity));
  }

  async findByUserId(userId: string): Promise<ChannelMembershipEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { userId },
    });
    return ormEntities.map((ormEntity) => this.mapper.toDomain(ormEntity));
  }

  async countByChannelId(channelId: string): Promise<number> {
    return this.ormRepository.count({
      where: { channelId, status: Equal(ChannelMembershipStatus.ACTIVE) },
    });
  }

  async findByUserIdAndChannelIdActive(
    userId: string,
    channelId: string,
  ): Promise<ChannelMembershipEntity | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { userId, channelId, status: ChannelMembershipStatus.ACTIVE },
    });
    if (!ormEntity) {
      return null;
    }
    const domain = this.mapper.toDomain(ormEntity);
    return domain.isCurrentlyActive() ? domain : null;
  }
}
