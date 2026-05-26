import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';

import {
  FINANCE_PAYMENT_CLIENT,
  type IFinancePaymentClient,
} from '@shared/application/interfaces/finance-payment-client.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';

import type { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';
import {
  ChannelStatus,
  MembershipReviewStatus,
} from '../../domain/entities/channel.entity';
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
import type { ChannelMembershipResponse } from '../dtos/channel-membership.response';
import type { PurchaseMembershipCommand } from '../dtos/purchase-membership.command';
import type { PurchaseMembershipResponse } from '../dtos/purchase-membership.response';
import { HandleMembershipPaymentSuccessUseCase } from './handle-membership-payment-success.use-case';

@Injectable()
export class PurchaseMembershipUseCase extends BaseUseCase<
  PurchaseMembershipCommand,
  PurchaseMembershipResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(CHANNEL_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: IChannelMembershipRepository,
    @Inject(MEMBERSHIP_TIER_REPOSITORY)
    private readonly membershipTierRepository: IMembershipTierRepository,
    @Inject(FINANCE_PAYMENT_CLIENT)
    private readonly financePaymentClient: IFinancePaymentClient,
    private readonly handleMembershipPaymentSuccessUseCase: HandleMembershipPaymentSuccessUseCase,
  ) {
    super();
  }

  public async execute(
    command: PurchaseMembershipCommand,
  ): Promise<PurchaseMembershipResponse> {
    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    }

    if (channel.userId === command.userId) {
      throw new BadRequestException(
        ERROR_MESSAGES.CANNOT_PURCHASE_OWN_MEMBERSHIP,
      );
    }

    if (
      channel.status !== ChannelStatus.ACTIVE ||
      channel.isMembershipClosedByAdmin ||
      channel.membershipReviewStatus !== MembershipReviewStatus.APPROVED
    ) {
      throw new ConflictException(
        ERROR_MESSAGES.CHANNEL_MEMBERSHIP_NOT_AVAILABLE,
      );
    }

    const tier = await this.membershipTierRepository.findById(command.tierId);

    if (!tier || tier.channelId !== channel.id) {
      throw new NotFoundException(ERROR_MESSAGES.MEMBERSHIP_TIER_NOT_FOUND);
    }

    if (!tier.isAcceptingNew) {
      throw new ConflictException(
        ERROR_MESSAGES.MEMBERSHIP_TIER_NOT_ACCEPTING_NEW_BUYERS,
      );
    }

    const existingMembership =
      await this.membershipRepository.findByUserIdAndChannelId(
        command.userId,
        channel.id,
      );

    if (existingMembership?.isCurrentlyActive()) {
      throw new BadRequestException(ERROR_MESSAGES.MEMBERSHIP_ALREADY_ACTIVE);
    }

    const currentExpiryKey =
      existingMembership?.expiryDate?.toISOString() ?? 'new';
    let paymentTransactionId: string | null = null;

    if (tier.priceCoin > 0) {
      const payment = await this.financePaymentClient.charge({
        payerUserId: command.userId,
        idempotencyKey: `membership-purchase:${command.userId}:${tier.id}:${currentExpiryKey}`,
        traceId: command.traceId,
        serviceType: 'membership',
        serviceId: tier.id,
        channelId: channel.id,
        channelOwnerId: channel.userId,
        coinAmount: tier.priceCoin,
        metadata: {
          packageName: tier.name,
        },
      });
      paymentTransactionId = payment.transactions[0]?.id ?? null;

      if (!paymentTransactionId) {
        throw new InternalServerErrorException(
          ERROR_MESSAGES.MEMBERSHIP_PAYMENT_TRANSACTION_MISSING,
        );
      }
    }

    await this.handleMembershipPaymentSuccessUseCase.execute({
      eventId: paymentTransactionId
        ? `sync:${paymentTransactionId}`
        : `membership-free:${command.userId}:${tier.id}:${currentExpiryKey}`,
      data: {
        userId: command.userId,
        channelId: channel.id,
        membershipTierId: tier.id,
        paymentType: 'new',
        chargedCoinAmount: tier.priceCoin,
        ledgerReferenceId: paymentTransactionId,
      },
    });

    const membership = await this.membershipRepository.findByUserIdAndChannelId(
      command.userId,
      channel.id,
    );

    if (!membership) {
      throw new InternalServerErrorException(
        ERROR_MESSAGES.MEMBERSHIP_NOT_CREATED_AFTER_PAYMENT,
      );
    }

    return {
      membership: this.toMembershipResponse(membership),
      chargedCoinAmount: tier.priceCoin,
      paymentTransactionId,
    };
  }

  private toMembershipResponse(
    membership: ChannelMembershipEntity,
  ): ChannelMembershipResponse {
    return {
      id: membership.id,
      userId: membership.userId,
      channelId: membership.channelId,
      membershipId: membership.membershipId,
      expiryDate: membership.expiryDate,
      retryCount: membership.retryCount,
      status: membership.status,
      autoRenewEnabled: membership.autoRenewEnabled,
      renewalStatus: membership.renewalStatus,
      renewalReminderSentAt: membership.renewalReminderSentAt,
      lastRenewalAttemptAt: membership.lastRenewalAttemptAt,
      nextRenewalAttemptAt: membership.nextRenewalAttemptAt,
      createdAt: membership.createdAt,
      updatedAt: membership.updatedAt,
    };
  }
}
