import { Inject, Injectable } from '@nestjs/common';
import {
  EVENT_PUBLISHER,
  type IEventPublisher,
} from '@shared/application/interfaces/event-publisher.interface';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import type {
  IMembershipCoinCompensationPublisher,
  MembershipCoinCompensationRequest,
} from '../../application/interfaces/membership-coin-compensation.publisher.interface';

@Injectable()
export class MembershipCoinCompensationPublisher
  implements IMembershipCoinCompensationPublisher
{
  constructor(
    @Inject(EVENT_PUBLISHER)
    private readonly eventPublisher: IEventPublisher,
    private readonly configService: ConfigService,
  ) {}

  async publishCompensationRequest(
    request: MembershipCoinCompensationRequest,
  ): Promise<void> {
    const topic = this.configService.get<string>(
      'KAFKA_MEMBERSHIP_COIN_COMPENSATION_TOPIC',
      'membership.coin_compensation_required',
    );

    await this.eventPublisher.emit(topic, [
      {
        key: request.userId,
        value: {
          eventId: crypto.randomUUID(),
          eventType: 'membership.coin_compensation_required',
          aggregateId: request.channelId,
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
