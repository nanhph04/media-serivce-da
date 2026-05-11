import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  IDEMPOTENCY_STORE,
  type IIdempotencyStore,
} from '@shared/application/interfaces/cache-store.interface';
import { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';
import { ChannelStatus } from '../../domain/entities/channel.entity';
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
import type { HandleMembershipPaymentSuccessCommand } from '../dtos/handle-membership-payment-success.command';
import {
  MEMBERSHIP_BLOCKED_REASON,
  MEMBERSHIP_COIN_COMPENSATION_PUBLISHER,
  type IMembershipCoinCompensationPublisher,
  type MembershipBlockedReason,
} from '../interfaces/membership-coin-compensation.publisher.interface';

@Injectable()
export class HandleMembershipPaymentSuccessUseCase extends BaseUseCase<
  HandleMembershipPaymentSuccessCommand,
  void
> {
  constructor(
    @Inject(CHANNEL_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: IChannelMembershipRepository,
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
    @Inject(IDEMPOTENCY_STORE)
    private readonly idempotencyStore: IIdempotencyStore,
    @Inject(MEMBERSHIP_COIN_COMPENSATION_PUBLISHER)
    private readonly compensationPublisher: IMembershipCoinCompensationPublisher,
  ) {
    super();
  }

  async execute(command: HandleMembershipPaymentSuccessCommand): Promise<void> {
    if (!(await this.markEventProcessing(command.eventId))) {
      return;
    }

    const policyRejection = await this.resolvePolicyRejection(command);
    if (policyRejection) {
      await this.publishCompensation(command, policyRejection);
      return;
    }

    const existing = await this.membershipRepository.findByUserIdAndChannelId(
      command.data.userId,
      command.data.channelId,
    );

    if (existing) {
      existing.syncMembership({
        membershipId: command.data.membershipTierId,
        expiryDate: this.resolveExpiryDate(
          command.data.expiryDate,
          existing.expiryDate,
        ),
      });
      await this.membershipRepository.upsert(existing);
      return;
    }

    const membership = ChannelMembershipEntity.create({
      userId: command.data.userId,
      channelId: command.data.channelId,
      membershipId: command.data.membershipTierId,
      expiryDate: this.resolveExpiryDate(command.data.expiryDate),
    });
    await this.membershipRepository.upsert(membership);
  }

  private async markEventProcessing(eventId: string): Promise<boolean> {
    return this.idempotencyStore.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }

  private async resolvePolicyRejection(
    command: HandleMembershipPaymentSuccessCommand,
  ): Promise<MembershipBlockedReason | null> {
    const channel = await this.channelRepository.findById(
      command.data.channelId,
    );
    if (!channel) {
      return MEMBERSHIP_BLOCKED_REASON.CHANNEL_NOT_FOUND;
    }

    if (channel.status !== ChannelStatus.ACTIVE) {
      return MEMBERSHIP_BLOCKED_REASON.CHANNEL_INACTIVE;
    }

    if (channel.isMembershipClosedByAdmin) {
      return MEMBERSHIP_BLOCKED_REASON.ADMIN_CLOSED;
    }

    const tier = await this.membershipTierRepository.findById(
      command.data.membershipTierId,
    );

    if (!tier || tier.channelId !== command.data.channelId) {
      return MEMBERSHIP_BLOCKED_REASON.TIER_INVALID;
    }

    if (!tier.isAcceptingNew) {
      return MEMBERSHIP_BLOCKED_REASON.TIER_CLOSED;
    }

    return null;
  }

  private async publishCompensation(
    command: HandleMembershipPaymentSuccessCommand,
    reasonCode: MembershipBlockedReason,
  ): Promise<void> {
    if (
      command.data.chargedCoinAmount === undefined &&
      command.data.ledgerReferenceId === undefined
    ) {
      throw new Error(
        'Payment compensation requires chargedCoinAmount or ledgerReferenceId',
      );
    }

    await this.compensationPublisher.publishCompensationRequest({
      sourcePaymentEventId: command.eventId,
      userId: command.data.userId,
      channelId: command.data.channelId,
      membershipTierId: command.data.membershipTierId,
      paymentType: command.data.paymentType,
      chargedCoinAmount: command.data.chargedCoinAmount ?? null,
      ledgerReferenceId: command.data.ledgerReferenceId ?? null,
      reasonCode,
    });

    this.logger.logWarn('Membership payment rejected by policy', {
      eventId: command.eventId,
      userId: command.data.userId,
      channelId: command.data.channelId,
      membershipTierId: command.data.membershipTierId,
      reasonCode,
    });
  }

  private resolveExpiryDate(
    expiryDate: string | null | undefined,
    currentExpiryDate?: Date | null,
  ): Date {
    if (expiryDate) {
      return new Date(expiryDate);
    }

    const now = Date.now();
    const baseTime =
      currentExpiryDate && currentExpiryDate.getTime() > now
        ? currentExpiryDate.getTime()
        : now;
    const nextExpiryDate = new Date(baseTime);
    nextExpiryDate.setMonth(nextExpiryDate.getMonth() + 1);

    return nextExpiryDate;
  }
}
