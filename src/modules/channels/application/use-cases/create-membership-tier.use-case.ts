import { IMembershipTierRepository } from '../../domain/repositories/membership-tier.repository';
import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import { CreateMembershipTierCommand } from '../dtos/create-membership-tier.command';
import { MembershipTierResponse } from '../dtos/membership-tier.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@shared/domain/exceptions/domain.exception';
import { ConfigService } from '@shared/infrastructure/config/config.service';

export class CreateMembershipTierUseCase extends BaseUseCase<
  CreateMembershipTierCommand,
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
    command: CreateMembershipTierCommand,
  ): Promise<MembershipTierResponse> {
    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.userId !== command.userId) {
      throw new ForbiddenException('You do not own this channel');
    }

    if (![1, 2, 3].includes(command.level)) {
      throw new BadRequestException('Level must be 1, 2, or 3');
    }

    const existingTiers = await this.membershipTierRepository.findByChannelId(
      command.channelId,
    );
    const existingTier = existingTiers.find(
      (tier) => tier.level === command.level,
    );

    if (existingTier) {
      if (existingTier.isAcceptingNew) {
        existingTier.hide();
        await this.membershipTierRepository.update(existingTier);
      } else {
        throw new ConflictException(
          'Tier is hidden, please update existing tier instead',
        );
      }
    }

    const minPrice = this.configService.getMinPriceForLevel(command.level);

    if (command.priceCoin < minPrice) {
      throw new BadRequestException(
        `Price must be at least ${minPrice} coin for level ${command.level}`,
      );
    }

    const tier = MembershipTierEntity.create({
      channelId: command.channelId,
      name: command.name,
      level: command.level,
      priceCoin: command.priceCoin,
    });

    await this.membershipTierRepository.create(tier);

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
