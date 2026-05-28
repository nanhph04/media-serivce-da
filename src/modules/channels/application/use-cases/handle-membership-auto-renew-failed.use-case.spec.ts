import {
  ChannelMembershipEntity,
  ChannelMembershipRenewalStatus,
} from '../../domain/entities/channel-membership.entity';
import { HandleMembershipAutoRenewFailedUseCase } from './handle-membership-auto-renew-failed.use-case';

class FakeChannelMembershipRepository {
  public membership: ChannelMembershipEntity | null = null;

  findById(id: string): Promise<ChannelMembershipEntity | null> {
    if (this.membership?.id !== id) {
      return Promise.resolve(null);
    }

    return Promise.resolve(this.membership);
  }

  update(membership: ChannelMembershipEntity): Promise<void> {
    this.membership = membership;
    return Promise.resolve();
  }
}

describe('HandleMembershipAutoRenewFailedUseCase', () => {
  const idempotencyStore = {
    setIfNotExists: jest.fn(),
  };
  const configService = {
    getNumber: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    idempotencyStore.setIfNotExists.mockResolvedValue(true);
    configService.getNumber.mockImplementation(
      (key: string, defaultValue: number) => defaultValue,
    );
  });

  it('marks retryable failures as retrying once', async () => {
    const repository = new FakeChannelMembershipRepository();
    repository.membership = ChannelMembershipEntity.create({
      userId: 'user-1',
      channelId: 'channel-1',
      membershipId: 'tier-1',
      expiryDate: new Date('2026-05-10T00:00:00.000Z'),
    });
    repository.membership.markRenewalRequested(
      new Date('2026-05-10T00:00:00.000Z'),
    );
    const useCase = new HandleMembershipAutoRenewFailedUseCase(
      repository as never,
      idempotencyStore as never,
      configService as never,
    );

    await useCase.execute({
      eventId: 'failed-event-1',
      data: {
        membershipRecordId: repository.membership.id,
        sourceEventId: 'renew-request-event-1',
        userId: 'user-1',
        channelId: 'channel-1',
        membershipTierId: 'tier-1',
        reasonCode: 'INSUFFICIENT_BALANCE',
        retryable: true,
        idempotencyKey: 'membership-renew:1',
      },
    });

    expect(repository.membership.retryCount).toBe(1);
    expect(repository.membership.renewalStatus).toBe(
      ChannelMembershipRenewalStatus.RETRYING,
    );
    expect(idempotencyStore.setIfNotExists).toHaveBeenCalledWith(
      'media:membership-auto-renew-failed:renew-request-event-1',
      '1',
      60 * 60 * 24 * 7,
    );
  });

  it('ignores duplicate failed events', async () => {
    idempotencyStore.setIfNotExists.mockResolvedValue(false);
    const repository = new FakeChannelMembershipRepository();
    repository.membership = ChannelMembershipEntity.create({
      userId: 'user-1',
      channelId: 'channel-1',
      membershipId: 'tier-1',
      expiryDate: new Date('2026-05-10T00:00:00.000Z'),
    });
    repository.membership.markRenewalRequested(
      new Date('2026-05-10T00:00:00.000Z'),
    );
    const useCase = new HandleMembershipAutoRenewFailedUseCase(
      repository as never,
      idempotencyStore as never,
      configService as never,
    );

    await useCase.execute({
      eventId: 'failed-event-1',
      data: {
        membershipRecordId: repository.membership.id,
        userId: 'user-1',
        channelId: 'channel-1',
        membershipTierId: 'tier-1',
        reasonCode: 'UNKNOWN',
        retryable: true,
        idempotencyKey: 'membership-renew:1',
      },
    });

    expect(repository.membership.retryCount).toBe(0);
    expect(repository.membership.renewalStatus).toBe(
      ChannelMembershipRenewalStatus.PENDING,
    );
  });
});
