import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import {
  CHANNEL_MEMBERSHIP_REPOSITORY,
  type IChannelMembershipRepository,
} from '../../domain/repositories/channel-membership.repository';
import type { HandleMembershipAutoRenewFailedCommand } from '../dtos/handle-membership-auto-renew-failed.command';

@Injectable()
export class HandleMembershipAutoRenewFailedUseCase extends BaseUseCase<
  HandleMembershipAutoRenewFailedCommand,
  void
> {
  constructor(
    @Inject(CHANNEL_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: IChannelMembershipRepository,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async execute(
    command: HandleMembershipAutoRenewFailedCommand,
  ): Promise<void> {
    const membership = await this.membershipRepository.findById(
      command.data.membershipRecordId,
    );

    if (!membership || membership.userId !== command.data.userId) {
      return;
    }

    membership.markRenewalFailed({
      attemptedAt: new Date(),
      maxRetryCount: this.configService.getNumber(
        'MEMBERSHIP_RENEW_MAX_RETRY',
        3,
      ),
      retryDelayHours: command.data.retryable
        ? this.configService.getNumber('MEMBERSHIP_RENEW_RETRY_DELAY_HOURS', 12)
        : 0,
    });

    if (!command.data.retryable) {
      membership.setAutoRenewEnabled(false);
    }

    await this.membershipRepository.update(membership);
  }
}
