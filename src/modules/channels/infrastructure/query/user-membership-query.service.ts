import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChannelMembershipOrmEntity } from '../persistence/channel-membership.orm-entity';
import { ChannelOrmEntity } from '../persistence/channel.orm-entity';
import { MembershipTierOrmEntity } from '../persistence/membership-tier.orm-entity';
import type {
  IUserMembershipQueryService,
  UserMembershipQuery,
  UserMembershipQueryResult,
} from '../../application/interfaces/user-membership-query.service.interface';
import type { ChannelMembershipStatus } from '../../domain/entities/channel-membership.entity';

interface UserMembershipRawRow {
  membership_id: string;
  channel_id: string;
  channel_name: string;
  channel_avatar_url: string | null;
  tier_id: string;
  tier_name: string;
  tier_level: number | string;
  price_coin: number | string;
  started_at: Date | string;
  expiry_date: Date | string | null;
  status: ChannelMembershipStatus;
  is_membership_closed_by_admin: boolean | number | string;
}

@Injectable()
export class UserMembershipQueryService implements IUserMembershipQueryService {
  constructor(
    @InjectRepository(ChannelMembershipOrmEntity)
    private readonly membershipOrmRepository: Repository<ChannelMembershipOrmEntity>,
  ) {}

  async getMembershipsByUserId(
    query: UserMembershipQuery,
  ): Promise<UserMembershipQueryResult> {
    const offset = (query.page - 1) * query.limit;
    const baseQueryBuilder = this.membershipOrmRepository
      .createQueryBuilder('membership')
      .innerJoin(
        ChannelOrmEntity,
        'channel',
        'channel.id = membership.channelId',
      )
      .innerJoin(
        MembershipTierOrmEntity,
        'tier',
        'tier.id = membership.membershipId',
      )
      .where('membership.userId = :userId', { userId: query.userId })
      .select([
        'membership.id AS membership_id',
        'membership.channelId AS channel_id',
        'channel.name AS channel_name',
        'channel.avatarUrl AS channel_avatar_url',
        'membership.membershipId AS tier_id',
        'tier.name AS tier_name',
        'tier.level AS tier_level',
        'tier.priceCoin AS price_coin',
        'membership.createdAt AS started_at',
        'membership.expiryDate AS expiry_date',
        'membership.status AS status',
        'channel.isMembershipClosedByAdmin AS is_membership_closed_by_admin',
      ])
      .orderBy('membership.updatedAt', 'DESC')
      .addOrderBy('membership.createdAt', 'DESC');

    const [rows, total] = await Promise.all([
      baseQueryBuilder
        .skip(offset)
        .take(query.limit)
        .getRawMany<UserMembershipRawRow>(),
      baseQueryBuilder.clone().getCount(),
    ]);

    return {
      items: rows.map((row) => ({
        membershipId: row.membership_id,
        channelId: row.channel_id,
        channelName: row.channel_name,
        channelAvatarUrl:
          typeof row.channel_avatar_url === 'string' &&
          row.channel_avatar_url.length > 0
            ? row.channel_avatar_url
            : null,
        tierId: row.tier_id,
        tierName: row.tier_name,
        tierLevel: Number(row.tier_level),
        priceCoin: Number(row.price_coin),
        startedAt: new Date(row.started_at),
        expiryDate: row.expiry_date ? new Date(row.expiry_date) : null,
        status: row.status,
        isMembershipClosedByAdmin:
          row.is_membership_closed_by_admin === true ||
          row.is_membership_closed_by_admin === 1 ||
          row.is_membership_closed_by_admin === 'true' ||
          row.is_membership_closed_by_admin === '1',
      })),
      total,
    };
  }
}
