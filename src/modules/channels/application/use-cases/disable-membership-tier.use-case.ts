import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
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

@Injectable()
export class DisableMembershipTierUseCase extends BaseUseCase<
  { channelId: string; tierId: string; userId: string },
  MembershipTierResponse
> {
  constructor(
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
  ) {
    super();
  }

  async execute(command: {
    channelId: string;
    tierId: string;
    userId: string;
  }): Promise<MembershipTierResponse> {
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

    const tier = await this.membershipTierRepository.findById(command.tierId);

    if (!tier || tier.channelId !== command.channelId) {
      throw new NotFoundException(ERROR_MESSAGES.MEMBERSHIP_TIER_NOT_FOUND);
    }

    tier.hide();
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
