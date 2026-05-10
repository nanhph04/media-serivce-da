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
        'membership.id AS membershipId',
        'membership.channelId AS channelId',
        'channel.name AS channelName',
        'channel.avatarUrl AS channelAvatarUrl',
        'membership.membershipId AS tierId',
        'tier.name AS tierName',
        'tier.level AS tierLevel',
        'tier.priceCoin AS priceCoin',
        'membership.createdAt AS startedAt',
        'membership.expiryDate AS expiryDate',
        'membership.status AS status',
        'channel.isMembershipClosedByAdmin AS isMembershipClosedByAdmin',
      ])
      .orderBy('membership.updatedAt', 'DESC')
      .addOrderBy('membership.createdAt', 'DESC');

    const [rows, total] = await Promise.all([
      baseQueryBuilder.skip(offset).take(query.limit).getRawMany(),
      baseQueryBuilder.clone().getCount(),
    ]);

    return {
      items: rows.map((row) => ({
        membershipId: row.membershipId,
        channelId: row.channelId,
        channelName: row.channelName,
        channelAvatarUrl:
          typeof row.channelAvatarUrl === 'string' && row.channelAvatarUrl.length > 0
            ? row.channelAvatarUrl
            : null,
        tierId: row.tierId,
        tierName: row.tierName,
        tierLevel: Number(row.tierLevel),
        priceCoin: Number(row.priceCoin),
        startedAt: new Date(row.startedAt),
        expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
        status: row.status,
        isMembershipClosedByAdmin:
          row.isMembershipClosedByAdmin === true ||
          row.isMembershipClosedByAdmin === 'true',
      })),
      total,
    };
  }
}
