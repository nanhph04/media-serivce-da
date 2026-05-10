import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { GetMyMembershipsQuery } from '../dtos/get-my-memberships.query';
import type { MyMembershipItemResponse } from '../dtos/my-membership-item.response';
import type { MyMembershipsResponse } from '../dtos/my-memberships.response';
import {
  USER_MEMBERSHIP_QUERY_SERVICE,
  type IUserMembershipQueryService,
} from '../interfaces/user-membership-query.service.interface';
import { resolveMembershipState } from '../services/membership-state.service';
import { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';

@Injectable()
export class GetMyMembershipsUseCase extends BaseUseCase<
  GetMyMembershipsQuery,
  MyMembershipsResponse
> {
  constructor(
    @Inject(USER_MEMBERSHIP_QUERY_SERVICE)
    private readonly userMembershipQueryService: IUserMembershipQueryService,
  ) {
    super();
  }

  async execute(query: GetMyMembershipsQuery): Promise<MyMembershipsResponse> {
    const result = await this.userMembershipQueryService.getMembershipsByUserId({
      userId: query.userId,
      page: query.page,
      limit: query.limit,
    });

    return {
      items: result.items.map(
        (item): MyMembershipItemResponse => this.toResponseItem(item),
      ),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / query.limit),
      },
    };
  }

  private toResponseItem(item: {
    membershipId: string;
    channelId: string;
    channelName: string;
    channelAvatarUrl: string | null;
    tierId: string;
    tierName: string;
    tierLevel: number;
    priceCoin: number;
    startedAt: Date;
    expiryDate: Date | null;
    status: ChannelMembershipEntity['status'];
    isMembershipClosedByAdmin: boolean;
  }): MyMembershipItemResponse {
    const membership = new ChannelMembershipEntity({
      id: item.membershipId,
      userId: '',
      channelId: item.channelId,
      membershipId: item.tierId,
      expiryDate: item.expiryDate,
      retryCount: 0,
      status: item.status,
      createdAt: item.startedAt,
      updatedAt: item.startedAt,
    });
    const state = resolveMembershipState({
      membership,
      isMembershipClosedByAdmin: item.isMembershipClosedByAdmin,
    });

    return {
      membershipId: item.membershipId,
      channelId: item.channelId,
      channelName: item.channelName,
      channelAvatarUrl: item.channelAvatarUrl,
      tierId: item.tierId,
      tierName: item.tierName,
      tierLevel: item.tierLevel,
      priceCoin: item.priceCoin,
      startedAt: item.startedAt,
      expiryDate: item.expiryDate,
      isActive: state.isActive,
      canRenew: state.canRenew,
      canUpgrade: state.canUpgrade,
      isMembershipClosedByAdmin: item.isMembershipClosedByAdmin,
      membershipBlockedReason: state.membershipBlockedReason,
    };
  }
}
