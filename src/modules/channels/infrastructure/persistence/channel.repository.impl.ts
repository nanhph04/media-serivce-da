import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IChannelRepository } from '../../domain/repositories/channel.repository';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import { ChannelOrmEntity } from './channel.orm-entity';

@Injectable()
export class ChannelRepositoryImpl implements IChannelRepository {
  constructor(
    @InjectRepository(ChannelOrmEntity)
    private readonly ormRepository: Repository<ChannelOrmEntity>,
  ) {}

  async create(channel: ChannelEntity): Promise<void> {
    const ormEntity = {
      id: channel.id,
      userId: channel.userId,
      name: channel.name,
      bio: channel.bio,
      avatarUrl: channel.avatarUrl,
      bannerUrl: channel.bannerUrl,
      status: channel.status,
      isEligibleForMembership: channel.isEligibleForMembership,
      isMembershipClosedByAdmin: channel.isMembershipClosedByAdmin,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
    await this.ormRepository.save(ormEntity);
  }

  async update(channel: ChannelEntity): Promise<void> {
    await this.ormRepository.save({
      id: channel.id,
      userId: channel.userId,
      name: channel.name,
      bio: channel.bio,
      avatarUrl: channel.avatarUrl,
      bannerUrl: channel.bannerUrl,
      status: channel.status,
      isEligibleForMembership: channel.isEligibleForMembership,
      isMembershipClosedByAdmin: channel.isMembershipClosedByAdmin,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    });
  }

  async delete(channel: ChannelEntity): Promise<void> {
    await this.ormRepository.update(
      { id: channel.id },
      { status: ChannelStatus.INACTIVE, updatedAt: new Date() },
    );
  }

  async findById(id: string): Promise<ChannelEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    if (!ormEntity) {
      return null;
    }
    return new ChannelEntity({
      id: ormEntity.id,
      userId: ormEntity.userId,
      name: ormEntity.name,
      bio: ormEntity.bio,
      avatarUrl: ormEntity.avatarUrl,
      bannerUrl: ormEntity.bannerUrl,
      status: ormEntity.status,
      isEligibleForMembership: ormEntity.isEligibleForMembership,
      isMembershipClosedByAdmin: ormEntity.isMembershipClosedByAdmin,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  async findByUserId(userId: string): Promise<ChannelEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { userId } });
    if (!ormEntity) {
      return null;
    }
    return new ChannelEntity({
      id: ormEntity.id,
      userId: ormEntity.userId,
      name: ormEntity.name,
      bio: ormEntity.bio,
      avatarUrl: ormEntity.avatarUrl,
      bannerUrl: ormEntity.bannerUrl,
      status: ormEntity.status,
      isEligibleForMembership: ormEntity.isEligibleForMembership,
      isMembershipClosedByAdmin: ormEntity.isMembershipClosedByAdmin,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }
}
