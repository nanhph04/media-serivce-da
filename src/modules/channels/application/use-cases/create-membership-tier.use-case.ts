import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { MembershipTierEntity } from '../../domain/entities/membership-tier.entity';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  MEMBERSHIP_CONFIG,
  type IMembershipConfig,
} from '@shared/application/interfaces/membership-config.interface';
import {
  ChannelStatus,
  MembershipReviewStatus,
} from '../../domain/entities/channel.entity';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import {
  MEMBERSHIP_TIER_REPOSITORY,
  type IMembershipTierRepository,
} from '../../domain/repositories/membership-tier.repository';
import type { CreateMembershipTierCommand } from '../dtos/create-membership-tier.command';
import type { MembershipTierResponse } from '../dtos/membership-tier.response';
import {
  CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE,
  type IChannelMembershipEligibilityService,
} from '../interfaces/channel-membership-eligibility.service.interface';

@Injectable()
export class CreateMembershipTierUseCase extends BaseUseCase<
  CreateMembershipTierCommand,
  MembershipTierResponse
> {
  constructor(
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(MEMBERSHIP_CONFIG)
    private readonly membershipConfig: IMembershipConfig,
    @Inject(CHANNEL_MEMBERSHIP_ELIGIBILITY_SERVICE)
    private readonly channelMembershipEligibilityService: IChannelMembershipEligibilityService,
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

    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new ForbiddenException('Channel is not active');
    }

    if (channel.isMembershipClosedByAdmin) {
      throw new ForbiddenException(
        'Membership registration is temporarily closed by admin',
      );
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
      throw new ConflictException('Membership tier level already exists');
    }

    const eligibility = channel.isEligibleForMembership
      ? null
      : await this.channelMembershipEligibilityService.syncChannelEligibility(
          command.channelId,
        );

    if (!channel.isEligibleForMembership && !eligibility?.isEligible) {
      throw new ForbiddenException(
        'Channel is not eligible to open membership registration yet',
        eligibility?.missingRequirements,
      );
    }

    if (channel.membershipReviewStatus !== MembershipReviewStatus.APPROVED) {
      const message =
        channel.membershipReviewStatus === MembershipReviewStatus.REJECTED
          ? 'Channel membership registration was rejected by admin'
          : 'Channel membership registration is pending admin approval';
      throw new ForbiddenException(
        message,
      );
    }

    const minPrice = this.membershipConfig.getMinPriceForLevel(command.level);

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
