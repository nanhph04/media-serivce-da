import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  CHANNEL_MEMBERSHIP_REPOSITORY,
  type IChannelMembershipRepository,
} from '../../domain/repositories/channel-membership.repository';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import {
  MEMBERSHIP_TIER_REPOSITORY,
  type IMembershipTierRepository,
} from '../../domain/repositories/membership-tier.repository';
import {
  MEMBERSHIP_AUTO_RENEW_PUBLISHER,
  type IMembershipAutoRenewPublisher,
} from '../interfaces/membership-auto-renew.publisher.interface';

export interface RequestDueMembershipRenewalsInput {
  now: Date;
  limit: number;
}

export interface RequestDueMembershipRenewalsOutput {
  scanned: number;
  requested: number;
  skipped: number;
}

@Injectable()
export class RequestDueMembershipRenewalsUseCase extends BaseUseCase<
  RequestDueMembershipRenewalsInput,
  RequestDueMembershipRenewalsOutput
> {
  constructor(
    @Inject(CHANNEL_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: IChannelMembershipRepository,
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
    @Inject(MEMBERSHIP_AUTO_RENEW_PUBLISHER)
    private readonly autoRenewPublisher: IMembershipAutoRenewPublisher,
  ) {
    super();
  }

  async execute(
    input: RequestDueMembershipRenewalsInput,
  ): Promise<RequestDueMembershipRenewalsOutput> {
    const memberships = await this.membershipRepository.findDueRenewals({
      now: input.now,
      limit: input.limit,
    });
    let requested = 0;
    let skipped = 0;

    for (const membership of memberships) {
      const [channel, tier] = await Promise.all([
        this.channelRepository.findById(membership.channelId),
        this.membershipTierRepository.findById(membership.membershipId),
      ]);

      if (!channel || !tier || !membership.expiryDate) {
        skipped += 1;
        continue;
      }

      const currentExpiryDate = membership.expiryDate.toISOString();
      await this.autoRenewPublisher.publishRenewalRequested({
        membershipRecordId: membership.id,
        userId: membership.userId,
        channelId: membership.channelId,
        channelOwnerId: channel.userId,
        membershipTierId: tier.id,
        coinAmount: tier.priceCoin,
        currentExpiryDate,
        paymentType: 'renew',
        idempotencyKey: `membership-renew:${membership.id}:${currentExpiryDate}`,
      });

      membership.markRenewalRequested(input.now);
      await this.membershipRepository.update(membership);
      requested += 1;
    }

    return { scanned: memberships.length, requested, skipped };
  }
}
