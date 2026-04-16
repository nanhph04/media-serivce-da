import { IMembershipTierRepository } from '../../domain/repositories/membership-tier.repository';
import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { UpdateMembershipTierCommand } from '../dtos/update-membership-tier.command';
import { MembershipTierResponse } from '../dtos/membership-tier.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@shared/domain/exceptions/domain.exception';
import { ConfigService } from '@shared/infrastructure/config/config.service';

export class UpdateMembershipTierUseCase extends BaseUseCase<
  UpdateMembershipTierCommand,
  MembershipTierResponse
> {
  constructor(
    private readonly membershipTierRepository: IMembershipTierRepository,
    private readonly channelRepository: IChannelRepository,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async execute(
    command: UpdateMembershipTierCommand,
  ): Promise<MembershipTierResponse> {
    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.userId !== command.userId) {
      throw new ForbiddenException('You do not own this channel');
    }

    const tier = await this.membershipTierRepository.findById(command.tierId);

    if (!tier) {
      throw new NotFoundException('Membership tier not found');
    }

    if (tier.channelId !== command.channelId) {
      throw new NotFoundException('Membership tier not found');
    }

    if (command.priceCoin !== undefined) {
      const minPrice = this.configService.getMinPriceForLevel(tier.level);

      if (command.priceCoin < minPrice) {
        throw new BadRequestException(
          `Price must be at least ${minPrice} coin for level ${tier.level}`,
        );
      }
    }

    if (command.isAcceptingNew !== undefined) {
      if (command.isAcceptingNew) {
        tier.show();
      } else {
        tier.hide();
      }
    }

    tier.update({
      name: command.name,
      priceCoin: command.priceCoin,
      isAcceptingNew: command.isAcceptingNew,
    });

    await this.membershipTierRepository.update(tier);

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
