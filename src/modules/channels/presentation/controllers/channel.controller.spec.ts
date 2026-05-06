import { ChannelStatus } from '../../domain/entities/channel.entity';
import { ChannelController } from './channel.controller';

describe('ChannelController', () => {
  const createChannelUseCase = {
    execute: jest.fn(),
  };
  const updateChannelUseCase = {
    execute: jest.fn(),
  };
  const getCurrentChannelUseCase = {
    execute: jest.fn(),
  };
  const getChannelDetailUseCase = {
    execute: jest.fn(),
  };
  const getMembershipStatusUseCase = {
    execute: jest.fn(),
  };
  const moderateChannelMembershipUseCase = {
    execute: jest.fn(),
  };

  const controller = new ChannelController(
    createChannelUseCase as never,
    updateChannelUseCase as never,
    getCurrentChannelUseCase as never,
    getChannelDetailUseCase as never,
    getMembershipStatusUseCase as never,
    moderateChannelMembershipUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the current user channel summary', async () => {
    getCurrentChannelUseCase.execute.mockResolvedValue({
      channelId: 'channel-1',
      userId: 'owner-1',
      status: ChannelStatus.INACTIVE,
      isEligibleForMembership: false,
      isMembershipClosedByAdmin: true,
    });

    const result = await controller.getCurrentChannel('owner-1');

    expect(getCurrentChannelUseCase.execute).toHaveBeenCalledWith({
      userId: 'owner-1',
    });
    expect(result).toEqual({
      channelId: 'channel-1',
      userId: 'owner-1',
      status: ChannelStatus.INACTIVE,
      isEligibleForMembership: false,
      isMembershipClosedByAdmin: true,
    });
  });
});
