import { IMembershipTierRepository } from '../../domain/repositories/membership-tier.repository';
import { MembershipTierResponse } from '../dtos/membership-tier.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';

export class GetMembershipTierUseCase extends BaseUseCase<
  { channelId: string; tierId: string },
  MembershipTierResponse
> {
  constructor(
    private readonly membershipTierRepository: IMembershipTierRepository,
  ) {
    super();
  }

  async execute(command: {
    channelId: string;
    tierId: string;
  }): Promise<MembershipTierResponse> {
    const tier = await this.membershipTierRepository.findById(command.tierId);

    if (!tier) {
      throw new NotFoundException('Membership tier not found');
    }

    if (tier.channelId !== command.channelId) {
      throw new NotFoundException('Membership tier not found');
    }

    return {
      id: tier.id,
      channelId: tier.channelId,
      name: tier.name,
      level: tier.level,
      priceCoin: tier.priceCoin,
      isAcceptingNew: tier.isAcceptingNew,
      createdAt: tier.createdAt,
      updatedAt: tier.updatedAt,
    };
  }
}
