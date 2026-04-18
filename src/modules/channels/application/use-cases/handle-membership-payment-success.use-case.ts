import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';
import {
  CHANNEL_MEMBERSHIP_REPOSITORY,
  type IChannelMembershipRepository,
} from '../../domain/repositories/channel-membership.repository';
import type { HandleMembershipPaymentSuccessCommand } from '../dtos/handle-membership-payment-success.command';

@Injectable()
export class HandleMembershipPaymentSuccessUseCase extends BaseUseCase<
  HandleMembershipPaymentSuccessCommand,
  void
> {
  constructor(
    @Inject(CHANNEL_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: IChannelMembershipRepository,
    private readonly cacheService: CacheService,
  ) {
    super();
  }

  async execute(
    command: HandleMembershipPaymentSuccessCommand,
  ): Promise<void> {
    if (!(await this.markEventProcessed(command.eventId))) {
      return;
    }

    const existing = await this.membershipRepository.findByUserIdAndChannelId(
      command.data.userId,
      command.data.channelId,
    );

    if (existing) {
      existing.syncMembership({
        membershipId: command.data.membershipTierId,
        expiryDate: command.data.expiryDate
          ? new Date(command.data.expiryDate)
          : null,
      });
      await this.membershipRepository.upsert(existing);
      return;
    }

    const membership = ChannelMembershipEntity.create({
      userId: command.data.userId,
      channelId: command.data.channelId,
      membershipId: command.data.membershipTierId,
      expiryDate: command.data.expiryDate
        ? new Date(command.data.expiryDate)
        : null,
    });
    await this.membershipRepository.upsert(membership);
  }

  private async markEventProcessed(eventId: string): Promise<boolean> {
    return this.cacheService.setIfNotExists(
      `media:event:${eventId}`,
      '1',
      60 * 60 * 24,
    );
  }
}
