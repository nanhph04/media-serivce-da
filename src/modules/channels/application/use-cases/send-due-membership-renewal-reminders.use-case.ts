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

export interface SendDueMembershipRenewalRemindersInput {
  now: Date;
  reminderHours: number;
  limit: number;
}

export interface SendDueMembershipRenewalRemindersOutput {
  scanned: number;
  sent: number;
  skipped: number;
}

@Injectable()
export class SendDueMembershipRenewalRemindersUseCase extends BaseUseCase<
  SendDueMembershipRenewalRemindersInput,
  SendDueMembershipRenewalRemindersOutput
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
    input: SendDueMembershipRenewalRemindersInput,
  ): Promise<SendDueMembershipRenewalRemindersOutput> {
    const reminderBefore = new Date(
      input.now.getTime() + input.reminderHours * 60 * 60 * 1000,
    );
    const memberships = await this.membershipRepository.findDueRenewalReminders(
      {
        now: input.now,
        reminderBefore,
        limit: input.limit,
      },
    );
    let sent = 0;
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

      await this.autoRenewPublisher.publishReminderRequested({
        membershipRecordId: membership.id,
        userId: membership.userId,
        channelId: membership.channelId,
        channelName: channel.name,
        membershipTierId: tier.id,
        tierName: tier.name,
        coinAmount: tier.priceCoin,
        renewalDate: membership.expiryDate.toISOString(),
      });

      membership.markRenewalReminderSent(input.now);
      await this.membershipRepository.update(membership);
      sent += 1;
    }

    return { scanned: memberships.length, sent, skipped };
  }
}
