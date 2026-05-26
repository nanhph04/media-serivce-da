import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  MEMBERSHIP_CONFIG,
  type IMembershipConfig,
} from '@shared/application/interfaces/membership-config.interface';
import { ChannelStatus } from '../../domain/entities/channel.entity';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import {
  MEMBERSHIP_TIER_REPOSITORY,
  type IMembershipTierRepository,
} from '../../domain/repositories/membership-tier.repository';
import type { MembershipTierResponse } from '../dtos/membership-tier.response';
import type { UpdateMembershipTierCommand } from '../dtos/update-membership-tier.command';

@Injectable()
export class UpdateMembershipTierUseCase extends BaseUseCase<
  UpdateMembershipTierCommand,
  MembershipTierResponse
> {
  constructor(
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(MEMBERSHIP_CONFIG)
    private readonly membershipConfig: IMembershipConfig,
  ) {
    super();
  }

  async execute(
    command: UpdateMembershipTierCommand,
  ): Promise<MembershipTierResponse> {
    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    }

    if (channel.userId !== command.userId) {
      throw new ForbiddenException(ERROR_MESSAGES.CHANNEL_NOT_OWNED);
    }

    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new ForbiddenException(ERROR_MESSAGES.CHANNEL_NOT_ACTIVE);
    }

    if (channel.isMembershipClosedByAdmin && command.isAcceptingNew === true) {
      throw new ForbiddenException(
        ERROR_MESSAGES.CHANNEL_MEMBERSHIP_REGISTRATION_CLOSED,
      );
    }

    const tier = await this.membershipTierRepository.findById(command.tierId);

    if (!tier) {
      throw new NotFoundException(ERROR_MESSAGES.MEMBERSHIP_TIER_NOT_FOUND);
    }

    if (tier.channelId !== command.channelId) {
      throw new NotFoundException(ERROR_MESSAGES.MEMBERSHIP_TIER_NOT_FOUND);
    }

    if (
      command.isAcceptingNew === true &&
      !tier.isAcceptingNew &&
      !channel.isEligibleForMembership
    ) {
      throw new ForbiddenException(
        ERROR_MESSAGES.CHANNEL_NOT_ELIGIBLE_TO_OPEN_MEMBERSHIP,
      );
    }

    if (command.priceCoin !== undefined) {
      const minPrice = this.membershipConfig.getMinPriceForLevel(tier.level);

      if (command.priceCoin < minPrice) {
        throw new BadRequestException(
          `${ERROR_MESSAGES.MEMBERSHIP_TIER_PRICE_MIN_PREFIX} ${minPrice} ${ERROR_MESSAGES.MEMBERSHIP_TIER_PRICE_MIN_SUFFIX} ${tier.level}`,
        );
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
