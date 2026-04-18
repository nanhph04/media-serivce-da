import { INestApplication, type CanActivate } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { LoggerInterceptor } from '@shared/presentation/interceptors/logger.interceptor';
import { SuccessResponseInterceptor } from '@shared/presentation/interceptors/success-response.interceptor';
import { CreateChannelUseCase } from '../../application/use-cases/create-channel.use-case';
import { GetChannelDetailUseCase } from '../../application/use-cases/get-channel-detail.use-case';
import { GetMembershipStatusUseCase } from '../../application/use-cases/get-membership-status.use-case';
import { UpdateChannelUseCase } from '../../application/use-cases/update-channel.use-case';
import { ChannelController } from './channel.controller';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';

describe('ChannelController', () => {
  let app: INestApplication;

  const createChannelUseCase = { execute: jest.fn() };
  const updateChannelUseCase = { execute: jest.fn() };
  const getChannelDetailUseCase = { execute: jest.fn() };
  const getMembershipStatusUseCase = { execute: jest.fn() };

  const allowGuard: CanActivate = {
    canActivate(): boolean {
      return true;
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [ChannelController],
      providers: [
        {
          provide: CreateChannelUseCase,
          useValue: createChannelUseCase,
        },
        {
          provide: UpdateChannelUseCase,
          useValue: updateChannelUseCase,
        },
        {
          provide: GetChannelDetailUseCase,
          useValue: getChannelDetailUseCase,
        },
        {
          provide: GetMembershipStatusUseCase,
          useValue: getMembershipStatusUseCase,
        },
      ],
    })
      .overrideGuard(InternalGatewayGuard)
      .useValue(allowGuard)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(
      new LoggerInterceptor({
        logInfo: jest.fn(),
        logError: jest.fn(),
      } as never),
      new SuccessResponseInterceptor(),
    );
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('serves the canonical membership-status route', async () => {
    getMembershipStatusUseCase.execute.mockResolvedValue({
      isActive: true,
      membershipId: 'tier-1',
      expiryDate: new Date('2026-05-01T00:00:00.000Z'),
    });

    await request(app.getHttpServer())
      .get('/channels/channel-1/membership-status')
      .set('x-user-id', 'user-1')
      .expect(200)
      .expect({
        success: true,
        code: 200,
        data: {
          isActive: true,
          membershipId: 'tier-1',
          expiryDate: '2026-05-01T00:00:00.000Z',
        },
      });

    expect(getMembershipStatusUseCase.execute).toHaveBeenCalledWith({
      channelId: 'channel-1',
      userId: 'user-1',
    });
  });
});
