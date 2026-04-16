import { IMembershipTierRepository } from '../../domain/repositories/membership-tier.repository';
import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { MembershipTierResponse } from '../dtos/membership-tier.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';

export class GetMembershipTiersUseCase extends BaseUseCase<
  { channelId: string },
  MembershipTierResponse[]
> {
  constructor(
    private readonly membershipTierRepository: IMembershipTierRepository,
    private readonly channelRepository: IChannelRepository,
  ) {
    super();
  }

  async execute(command: {
    channelId: string;
  }): Promise<MembershipTierResponse[]> {
    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

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
