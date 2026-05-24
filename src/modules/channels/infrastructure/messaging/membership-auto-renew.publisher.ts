import { Inject, Injectable } from '@nestjs/common';
import {
  EVENT_PUBLISHER,
  type IEventPublisher,
} from '@shared/application/interfaces/event-publisher.interface';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import type {
  IMembershipAutoRenewPublisher,
  MembershipAutoRenewRequest,
  MembershipRenewalReminderRequest,
} from '../../application/interfaces/membership-auto-renew.publisher.interface';

@Injectable()
export class MembershipAutoRenewPublisher implements IMembershipAutoRenewPublisher {
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
    private readonly configService: ConfigService,
  ) {}

  async publishReminderRequested(
    request: MembershipRenewalReminderRequest,
  ): Promise<void> {
    const topic = this.configService.get<string>(
      'KAFKA_MEMBERSHIP_AUTO_RENEW_REMINDER_REQUESTED_TOPIC',
      'membership.auto_renew.reminder_requested',
    );

    await this.eventPublisher.emit(topic, [
      {
        key: request.userId,
        value: {
          eventId: crypto.randomUUID(),
          eventType: 'membership.auto_renew.reminder_requested',
          aggregateId: request.membershipRecordId,
          timestamp: new Date().toISOString(),
          version: 1,
          traceId: crypto.randomUUID(),
          sourceService: 'media-service',
          data: request,
        },
      },
    ]);
  }

  async publishRenewalRequested(
    request: MembershipAutoRenewRequest,
  ): Promise<void> {
    const topic = this.configService.get<string>(
      'KAFKA_MEMBERSHIP_AUTO_RENEW_REQUESTED_TOPIC',
      'membership.auto_renew.requested',
    );

    await this.eventPublisher.emit(topic, [
      {
        key: request.userId,
        value: {
          eventId: crypto.randomUUID(),
          eventType: 'membership.auto_renew.requested',
          aggregateId: request.membershipRecordId,
          timestamp: new Date().toISOString(),
          version: 1,
          traceId: crypto.randomUUID(),
          sourceService: 'media-service',
          data: request,
        },
      },
    ]);
  }
}
