import { MembershipPaymentConsumer } from './membership-payment.consumer';

describe('MembershipPaymentConsumer', () => {
  const configService = {
    get: jest.fn(),
  };
  const kafkaService = {
    on: jest.fn(),
  };
  const handleMembershipPaymentSuccessUseCase = {
    execute: jest.fn(),
  };

  let consumer: MembershipPaymentConsumer;

  beforeEach(() => {
    jest.clearAllMocks();
    consumer = new MembershipPaymentConsumer(
      configService as never,
      kafkaService as never,
      handleMembershipPaymentSuccessUseCase as never,
    );
  });

  it('registers topic handler and forwards payload to use case', async () => {
    let handler:
      | ((payload: {
          value: {
            eventId: string;
            data: {
              userId: string;
              channelId: string;
              membershipTierId: string;
              paymentType: 'new' | 'renew' | 'upgrade';
              chargedCoinAmount?: number | null;
              ledgerReferenceId?: string | null;
              expiryDate?: string | null;
            };
          };
        }) => Promise<void>)
      | undefined;

    configService.get.mockReturnValue('membership.payment.success');
    kafkaService.on.mockImplementation(
      async (_topic: string, callback: typeof handler): Promise<void> => {
        handler = callback;
      },
    );

    await consumer.onModuleInit();

    expect(kafkaService.on).toHaveBeenCalledWith(
      'membership.payment.success',
      expect.any(Function),
    );

    await handler?.({
      value: {
        eventId: 'event-1',
        data: {
          userId: 'user-1',
          channelId: 'channel-1',
          membershipTierId: 'tier-1',
          paymentType: 'new',
          chargedCoinAmount: 50,
          ledgerReferenceId: 'ledger-1',
          expiryDate: '2026-05-01T00:00:00.000Z',
        },
      },
    });

    expect(handleMembershipPaymentSuccessUseCase.execute).toHaveBeenCalledWith({
      eventId: 'event-1',
      data: {
        userId: 'user-1',
        channelId: 'channel-1',
        membershipTierId: 'tier-1',
        paymentType: 'new',
        chargedCoinAmount: 50,
        ledgerReferenceId: 'ledger-1',
        expiryDate: '2026-05-01T00:00:00.000Z',
      },
    });
  });
});
