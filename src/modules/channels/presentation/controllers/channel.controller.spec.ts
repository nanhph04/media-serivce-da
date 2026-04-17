import { INestApplication, type CanActivate } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { ChannelController } from './channel.controller';
import { ChannelApplicationService } from '../../application/channel.application.service';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';

describe('ChannelController', () => {
  let app: INestApplication;

  const channelApplicationService = {
    getMembershipStatus: jest.fn(),
    createChannel: jest.fn(),
    updateChannel: jest.fn(),
    getChannelDetail: jest.fn(),
  };

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
          provide: ChannelApplicationService,
          useValue: channelApplicationService,
        },
      ],
    })
      .overrideGuard(InternalGatewayGuard)
      .useValue(allowGuard)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('serves the canonical membership-status route', async () => {
    channelApplicationService.getMembershipStatus.mockResolvedValue({
      isActive: true,
      membershipId: 'tier-1',
      expiryDate: new Date('2026-05-01T00:00:00.000Z'),
    });

    await request(app.getHttpServer())
      .get('/channels/channel-1/membership-status')
      .set('x-user-id', 'user-1')
      .expect(200)
      .expect({
        isActive: true,
        membershipId: 'tier-1',
        expiryDate: '2026-05-01T00:00:00.000Z',
      });

    expect(channelApplicationService.getMembershipStatus).toHaveBeenCalledWith({
      channelId: 'channel-1',
      userId: 'user-1',
    });
  });
});
