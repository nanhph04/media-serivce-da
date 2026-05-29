import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { IIntegrationEvent } from '@shared/domain/types/events/base-integration.event';
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
import type { MembershipAutoRenewRequest } from '../interfaces/membership-auto-renew.publisher.interface';
import {
  MEMBERSHIP_RENEWAL_TRANSACTION,
  type IMembershipRenewalTransaction,
} from '../interfaces/membership-renewal-transaction.interface';

export interface RequestDueMembershipRenewalsInput {
  now: Date;
  limit: number;
}

export interface RequestDueMembershipRenewalsOutput {
  scanned: number;
  requested: number;
  skipped: number;
}

const MEMBERSHIP_AUTO_RENEW_REQUESTED_TOPIC = 'membership.auto_renew.requested';

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
    @Inject(MEMBERSHIP_RENEWAL_TRANSACTION)
    private readonly membershipRenewalTransaction: IMembershipRenewalTransaction,
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
      const data: MembershipAutoRenewRequest = {
        membershipRecordId: membership.id,
        userId: membership.userId,
        channelId: membership.channelId,
        channelOwnerId: channel.userId,
        membershipTierId: tier.id,
        coinAmount: tier.priceCoin,
        currentExpiryDate,
        paymentType: 'renew',
        idempotencyKey: `membership-renew:${membership.id}:${currentExpiryDate}`,
      };
      const event: IIntegrationEvent<MembershipAutoRenewRequest> = {
        eventId: randomUUID(),
        eventType: MEMBERSHIP_AUTO_RENEW_REQUESTED_TOPIC,
        aggregateId: membership.id,
        timestamp: input.now.toISOString(),
        version: 1,
        traceId: randomUUID(),
        sourceService: 'media-service',
        data,
      };

      membership.markRenewalRequested(input.now);
      await this.membershipRenewalTransaction.persistRenewalRequest(
        membership,
        {
          topic: MEMBERSHIP_AUTO_RENEW_REQUESTED_TOPIC,
          messageKey: membership.userId,
          payload: event,
        },
      );
      requested += 1;
    }

    return { scanned: memberships.length, requested, skipped };
  }
}
