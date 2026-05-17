import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Equal, IsNull, LessThanOrEqual, Repository } from 'typeorm';
import type { IChannelMembershipRepository } from '../../domain/repositories/channel-membership.repository';
import {
  ChannelMembershipEntity,
  ChannelMembershipRenewalStatus,
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

  async findDueRenewalReminders(input: {
    now: Date;
    reminderBefore: Date;
    limit: number;
  }): Promise<ChannelMembershipEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: {
        status: ChannelMembershipStatus.ACTIVE,
        autoRenewEnabled: true,
        renewalStatus: ChannelMembershipRenewalStatus.IDLE,
        renewalReminderSentAt: IsNull(),
        expiryDate: LessThanOrEqual(input.reminderBefore),
      },
      order: { expiryDate: 'ASC' },
      take: input.limit,
    });

    return ormEntities
      .filter(
        (ormEntity) =>
          ormEntity.expiryDate !== null &&
          ormEntity.expiryDate.getTime() > input.now.getTime(),
      )
      .map((ormEntity) => this.mapper.toDomain(ormEntity));
  }

  async findDueRenewals(input: {
    now: Date;
    limit: number;
  }): Promise<ChannelMembershipEntity[]> {
    const ormEntities = await this.ormRepository
      .createQueryBuilder('membership')
      .where('membership.status = :status', {
        status: ChannelMembershipStatus.ACTIVE,
      })
      .andWhere('membership.autoRenewEnabled = :autoRenewEnabled', {
        autoRenewEnabled: true,
      })
      .andWhere('membership.expiryDate IS NOT NULL')
      .andWhere(
        new Brackets((query) => {
          query
            .where(
              'membership.renewalStatus = :idleStatus AND membership.expiryDate <= :now',
              {
                idleStatus: ChannelMembershipRenewalStatus.IDLE,
                now: input.now,
              },
            )
            .orWhere(
              'membership.renewalStatus = :retryingStatus AND membership.nextRenewalAttemptAt <= :now',
              {
                retryingStatus: ChannelMembershipRenewalStatus.RETRYING,
                now: input.now,
              },
            );
        }),
      )
      .orderBy('membership.expiryDate', 'ASC')
      .take(input.limit)
      .getMany();

    return ormEntities.map((ormEntity) => this.mapper.toDomain(ormEntity));
  }

  async disableAutoRenewByChannelId(channelId: string): Promise<number> {
    const result = await this.ormRepository.update(
      {
        channelId,
        status: ChannelMembershipStatus.ACTIVE,
        autoRenewEnabled: true,
      },
      {
        autoRenewEnabled: false,
        renewalStatus: ChannelMembershipRenewalStatus.DISABLED,
        nextRenewalAttemptAt: null,
        updatedAt: new Date(),
      },
    );

    return result.affected ?? 0;
  }

  async disableAutoRenewByUserId(userId: string): Promise<number> {
    const result = await this.ormRepository.update(
      {
        userId,
        status: ChannelMembershipStatus.ACTIVE,
        autoRenewEnabled: true,
      },
      {
        autoRenewEnabled: false,
        renewalStatus: ChannelMembershipRenewalStatus.DISABLED,
        nextRenewalAttemptAt: null,
        updatedAt: new Date(),
      },
    );

    return result.affected ?? 0;
  }
}
