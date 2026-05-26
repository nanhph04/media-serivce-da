import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  CHANNEL_MEMBERSHIP_REPOSITORY,
  type IChannelMembershipRepository,
} from '../../domain/repositories/channel-membership.repository';
import type { ChannelMembershipResponse } from '../dtos/channel-membership.response';
import type { UpdateMembershipAutoRenewCommand } from '../dtos/update-membership-auto-renew.command';

@Injectable()
export class UpdateMembershipAutoRenewUseCase extends BaseUseCase<
  UpdateMembershipAutoRenewCommand,
  ChannelMembershipResponse
> {
  constructor(
    @Inject(CHANNEL_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: IChannelMembershipRepository,
  ) {
    super();
  }

  async execute(
    command: UpdateMembershipAutoRenewCommand,
  ): Promise<ChannelMembershipResponse> {
    const membership = await this.membershipRepository.findById(
      command.membershipId,
    );

    if (!membership) {
      throw new NotFoundException(ERROR_MESSAGES.MEMBERSHIP_NOT_FOUND);
    }

    if (membership.userId !== command.userId) {
      throw new ForbiddenException(ERROR_MESSAGES.MEMBERSHIP_NOT_OWNED);
    }

    membership.setAutoRenewEnabled(command.enabled);
    await this.membershipRepository.update(membership);

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
