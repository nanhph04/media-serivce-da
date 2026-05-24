import { Inject, Injectable } from '@nestjs/common';
import {
  createPagination,
  type PaginatedResponse,
} from '@shared/application/dtos/paginated.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  MEMBERSHIP_TIER_REPOSITORY,
  type IMembershipTierRepository,
} from '../../domain/repositories/membership-tier.repository';
import type { MembershipTierResponse } from '../dtos/membership-tier.response';

@Injectable()
export class GetMembershipTiersUseCase extends BaseUseCase<
  { channelId: string; page: number; limit: number },
  PaginatedResponse<MembershipTierResponse>
> {
  constructor(
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
  ) {
    super();
  }

  async execute(command: {
    channelId: string;
    page: number;
    limit: number;
  }): Promise<PaginatedResponse<MembershipTierResponse>> {
    const result = await this.membershipTierRepository.findByChannelIdPaged(
      command.channelId,
      command.page,
      command.limit,
    );

    return {
      items: result.items.map((tier) => ({
        id: tier.id,
        channelId: tier.channelId,
        name: tier.name,
        level: tier.level,
        priceCoin: tier.priceCoin,
        isAcceptingNew: tier.isAcceptingNew,
        createdAt: tier.createdAt,
        updatedAt: tier.updatedAt,
      })),
      pagination: createPagination(command.page, command.limit, result.total),
    };
  }
}
