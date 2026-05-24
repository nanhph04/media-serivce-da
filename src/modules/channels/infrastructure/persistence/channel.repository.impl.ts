import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  type AdminChannelFilters,
  type AdminChannelCounts,
  type AdminChannelsPage,
  IChannelRepository,
} from '../../domain/repositories/channel.repository';
import {
  ChannelEntity,
  ChannelStatus,
  MembershipReviewStatus,
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
      membershipReviewStatus: channel.membershipReviewStatus,
      membershipRejectionReason: channel.membershipRejectionReason,
      membershipReviewedBy: channel.membershipReviewedBy,
      membershipReviewedAt: channel.membershipReviewedAt,
      membershipRequestedAt: channel.membershipRequestedAt,
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
      membershipReviewStatus: channel.membershipReviewStatus,
      membershipRejectionReason: channel.membershipRejectionReason,
      membershipReviewedBy: channel.membershipReviewedBy,
      membershipReviewedAt: channel.membershipReviewedAt,
      membershipRequestedAt: channel.membershipRequestedAt,
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
    return this.toDomain(ormEntity);
  }

  async findByMembershipReviewStatus(
    status: MembershipReviewStatus,
  ): Promise<ChannelEntity[]> {
    const ormEntities = await this.ormRepository.find({
      where: { membershipReviewStatus: status },
      order: { membershipRequestedAt: 'ASC', createdAt: 'ASC' },
    });

    return ormEntities.map((ormEntity) => this.toDomain(ormEntity));
  }

  async findByMembershipReviewStatusPaged(
    status: MembershipReviewStatus,
    page: number,
    limit: number,
  ): Promise<{ items: ChannelEntity[]; total: number }> {
    const [ormEntities, total] = await this.ormRepository.findAndCount({
      where: { membershipReviewStatus: status },
      order: { membershipRequestedAt: 'ASC', createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: ormEntities.map((ormEntity) => this.toDomain(ormEntity)),
      total,
    };
  }

  async findAdminChannels(
    filters: AdminChannelFilters,
  ): Promise<AdminChannelsPage> {
    const queryBuilder = this.ormRepository.createQueryBuilder('channel');

    if (filters.status) {
      queryBuilder.andWhere('channel.status = :status', {
        status: filters.status,
      });
    }

    if (filters.ownerId) {
      queryBuilder.andWhere('channel.userId = :ownerId', {
        ownerId: filters.ownerId,
      });
    }

    if (filters.q) {
      const partial = `%${escapeLikePattern(filters.q.toLowerCase())}%`;
      queryBuilder.andWhere(
        `(
          LOWER(channel.name) LIKE :partial ESCAPE '\\'
          OR LOWER(channel.bio) LIKE :partial ESCAPE '\\'
        )`,
        { partial },
      );
    }

    const [ormEntities, total] = await queryBuilder
      .orderBy('channel.updatedAt', 'DESC')
      .addOrderBy('channel.createdAt', 'DESC')
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getManyAndCount();

    return {
      items: ormEntities.map((ormEntity) => this.toDomain(ormEntity)),
      total,
    };
  }

  async getAdminChannelCounts(): Promise<AdminChannelCounts> {
    const row = await this.ormRepository
      .createQueryBuilder('channel')
      .select('COUNT(*)', 'totalChannels')
      .addSelect(
        `COUNT(*) FILTER (
          WHERE channel.is_eligible_for_membership = true
        )`,
        'eligibleForMembership',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE channel.is_membership_closed_by_admin = true
        )`,
        'membershipClosedByAdmin',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE channel.membership_review_status = :pending
        )`,
        'membershipPendingReview',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE channel.membership_review_status = :approved
        )`,
        'membershipApproved',
      )
      .addSelect(
        `COUNT(*) FILTER (
          WHERE channel.membership_review_status = :rejected
        )`,
        'membershipRejected',
      )
      .setParameters({
        pending: MembershipReviewStatus.PENDING,
        approved: MembershipReviewStatus.APPROVED,
        rejected: MembershipReviewStatus.REJECTED,
      })
      .getRawOne<{
        totalChannels?: string | number | null;
        eligibleForMembership?: string | number | null;
        membershipClosedByAdmin?: string | number | null;
        membershipPendingReview?: string | number | null;
        membershipApproved?: string | number | null;
        membershipRejected?: string | number | null;
      }>();

    return {
      totalChannels: Number(row?.totalChannels ?? 0),
      eligibleForMembership: Number(row?.eligibleForMembership ?? 0),
      membershipClosedByAdmin: Number(row?.membershipClosedByAdmin ?? 0),
      membershipPendingReview: Number(row?.membershipPendingReview ?? 0),
      membershipApproved: Number(row?.membershipApproved ?? 0),
      membershipRejected: Number(row?.membershipRejected ?? 0),
    };
  }

  private toDomain(ormEntity: ChannelOrmEntity): ChannelEntity {
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
      membershipReviewStatus: ormEntity.membershipReviewStatus,
      membershipRejectionReason: ormEntity.membershipRejectionReason,
      membershipReviewedBy: ormEntity.membershipReviewedBy,
      membershipReviewedAt: ormEntity.membershipReviewedAt,
      membershipRequestedAt: ormEntity.membershipRequestedAt,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  async findByUserId(userId: string): Promise<ChannelEntity | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { userId } });
    if (!ormEntity) {
      return null;
    }
    return this.toDomain(ormEntity);
  }
}

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}
