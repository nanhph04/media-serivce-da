import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import { RequestDueMembershipRenewalsUseCase } from '../../application/use-cases/request-due-membership-renewals.use-case';
import { SendDueMembershipRenewalRemindersUseCase } from '../../application/use-cases/send-due-membership-renewal-reminders.use-case';

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class MembershipAutoRenewScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private intervalId?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly sendDueMembershipRenewalRemindersUseCase: SendDueMembershipRenewalRemindersUseCase,
    private readonly requestDueMembershipRenewalsUseCase: RequestDueMembershipRenewalsUseCase,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(MembershipAutoRenewScheduler.name);
  }

  onApplicationBootstrap(): void {
    if (
      !this.configService.getBoolean('MEMBERSHIP_AUTO_RENEW_ENABLED', true)
    ) {
      this.logger.logInfo('Membership auto-renew scheduler disabled');
      return;
    }

    this.intervalId = setInterval(() => {
      void this.runOnce();
    }, this.configService.getNumber('MEMBERSHIP_RENEW_INTERVAL_MS', DEFAULT_INTERVAL_MS));
  }

  onModuleDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async runOnce(): Promise<void> {
    if (this.running) {
      this.logger.logWarn('Skipped auto-renew run because previous run is active');
      return;
    }

    this.running = true;

    try {
      const now = new Date();
      const limit = this.configService.getNumber(
        'MEMBERSHIP_RENEW_BATCH_SIZE',
        100,
      );
      const reminderSummary =
        await this.sendDueMembershipRenewalRemindersUseCase.execute({
          now,
          reminderHours: this.configService.getNumber(
            'MEMBERSHIP_RENEW_REMINDER_HOURS',
            24,
          ),
          limit,
        });
      const renewalSummary =
        await this.requestDueMembershipRenewalsUseCase.execute({
          now,
          limit,
        });

      this.logger.logInfo('Completed membership auto-renew run', {
        reminders: reminderSummary,
        renewals: renewalSummary,
      });
    } catch (error: unknown) {
      this.logger.logError('Membership auto-renew run failed', error);
    } finally {
      this.running = false;
    }
  }
}
