import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import type { ListMembershipReviewsQuery } from '../dtos/list-membership-reviews.query';
import type { MembershipReviewResponse } from '../dtos/membership-review.response';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import {
  CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE,
  type IChannelMembershipEligibilityService,
} from '../interfaces/channel-membership-eligibility.service.interface';

@Injectable()
export class ListMembershipReviewsUseCase extends BaseUseCase<
  ListMembershipReviewsQuery,
  MembershipReviewResponse[]
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE)
    private readonly channelMembershipEligibilityService: IChannelMembershipEligibilityService,
  ) {
    super();
  }

  async execute(
    query: ListMembershipReviewsQuery,
  ): Promise<MembershipReviewResponse[]> {
    this.ensureNonEmpty(query.adminId, 'Admin id is required');
    this.ensureAdminRole(query.role);

    const channels = await this.channelRepository.findByMembershipReviewStatus(
      query.status,
    );

    return Promise.all(
      channels.map(async (channel) => {
        const eligibility =
          await this.channelMembershipEligibilityService.getChannelEligibility(
            channel.id,
          );

        return {
          channelId: channel.id,
          userId: channel.userId,
          name: channel.name,
          status: channel.status,
          isEligibleForMembership: channel.isEligibleForMembership,
          isMembershipClosedByAdmin: channel.isMembershipClosedByAdmin,
          membershipReviewStatus: channel.membershipReviewStatus,
          membershipRejectionReason: channel.membershipRejectionReason,
          membershipRequestedAt: channel.membershipRequestedAt,
          membershipReviewedAt: channel.membershipReviewedAt,
          readyVideoCount: eligibility.readyVideoCount,
          minReadyVideoCount: eligibility.minReadyVideoCount,
          totalVideoViews: eligibility.totalVideoViews,
          minTotalVideoViews: eligibility.minTotalVideoViews,
        };
      }),
    );
  }

  private ensureNonEmpty(value: string, message: string): void {
    if (!value.trim()) {
      throw new BadRequestException(message);
    }
  }

  private ensureAdminRole(role: string | undefined): void {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }
  }
}
