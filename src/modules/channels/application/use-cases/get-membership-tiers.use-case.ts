import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  MEMBERSHIP_TIER_REPOSITORY,
  type IMembershipTierRepository,
} from '../../domain/repositories/membership-tier.repository';
import type { MembershipTierResponse } from '../dtos/membership-tier.response';

@Injectable()
export class GetMembershipTiersUseCase extends BaseUseCase<
  { channelId: string },
  MembershipTierResponse[]
> {
  constructor(
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
  ) {
    super();
  }

  async execute(command: {
    channelId: string;
  }): Promise<MembershipTierResponse[]> {
    const tiers = await this.membershipTierRepository.findByChannelId(
      command.channelId,
    );

    return tiers.map((tier) => ({
      id: tier.id,
      channelId: tier.channelId,
      name: tier.name,
      level: tier.level,
      priceCoin: tier.priceCoin,
      isAcceptingNew: tier.isAcceptingNew,
      createdAt: tier.createdAt,
      updatedAt: tier.updatedAt,
    }));
  }
}
