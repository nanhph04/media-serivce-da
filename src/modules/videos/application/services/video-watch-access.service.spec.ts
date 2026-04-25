import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { ChannelStatus } from '../../../channels/domain/entities/channel.entity';
import { VideoEntity, VideoStatus, VideoVisibility } from '../../domain/entities/video.entity';
import { VideoWatchAccessService } from './video-watch-access.service';

describe('VideoWatchAccessService', () => {
  const unlockRepository = {
    exists: jest.fn(),
  };
  const channelAccessService = {
    getViewerAccessContext: jest.fn(),
  };

  const service = new VideoWatchAccessService(
    unlockRepository as never,
    channelAccessService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    unlockRepository.exists.mockResolvedValue(false);
  });

  it('allows owner to watch a private video when stream is ready', async () => {
    channelAccessService.getViewerAccessContext.mockResolvedValue({
      channelOwnerId: 'owner-1',
      channelStatus: ChannelStatus.SUSPENDED,
      activeMembershipTierLevel: null,
    });

    await expect(
      service.assertCanWatch(
        buildVideo({
          ownerId: 'owner-1',
          visibility: VideoVisibility.PRIVATE,
          status: VideoStatus.PROCESSING,
          masterPlaylistKey: 'processed/master.m3u8',
        }),
        'owner-1',
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects owner when video has failed', async () => {
    channelAccessService.getViewerAccessContext.mockResolvedValue({
      channelOwnerId: 'owner-1',
      channelStatus: ChannelStatus.ACTIVE,
      activeMembershipTierLevel: null,
    });

    await expect(
      service.assertCanWatch(
        buildVideo({
          ownerId: 'owner-1',
          status: VideoStatus.FAILED,
          masterPlaylistKey: 'processed/master.m3u8',
        }),
        'owner-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('blocks viewers when channel is not active', async () => {
    channelAccessService.getViewerAccessContext.mockResolvedValue({
      channelOwnerId: 'owner-1',
      channelStatus: ChannelStatus.INACTIVE,
      activeMembershipTierLevel: null,
    });

    await expect(
      service.assertCanWatch(buildVideo(), 'viewer-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows viewers to watch a free public video', async () => {
    channelAccessService.getViewerAccessContext.mockResolvedValue({
      channelOwnerId: 'owner-1',
      channelStatus: ChannelStatus.ACTIVE,
      activeMembershipTierLevel: null,
    });

    await expect(service.assertCanWatch(buildVideo(), 'viewer-1')).resolves.toBeUndefined();
  });

  it('allows viewers with a qualifying membership tier', async () => {
    channelAccessService.getViewerAccessContext.mockResolvedValue({
      channelOwnerId: 'owner-1',
      channelStatus: ChannelStatus.ACTIVE,
      activeMembershipTierLevel: 2,
    });

    await expect(
      service.assertCanWatch(
        buildVideo({
          price: 10,
          requiredTierLevel: 2,
        }),
        'viewer-1',
      ),
    ).resolves.toBeUndefined();
  });

  it('allows viewers who unlocked the video', async () => {
    channelAccessService.getViewerAccessContext.mockResolvedValue({
      channelOwnerId: 'owner-1',
      channelStatus: ChannelStatus.ACTIVE,
      activeMembershipTierLevel: null,
    });
    unlockRepository.exists.mockResolvedValue(true);

    await expect(
      service.assertCanWatch(
        buildVideo({
          price: 10,
          requiredTierLevel: null,
        }),
        'viewer-1',
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects viewers without any eligible access path', async () => {
    channelAccessService.getViewerAccessContext.mockResolvedValue({
      channelOwnerId: 'owner-1',
      channelStatus: ChannelStatus.ACTIVE,
      activeMembershipTierLevel: null,
    });

    await expect(
      service.assertCanWatch(
        buildVideo({
          price: 10,
          requiredTierLevel: 2,
        }),
        'viewer-1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects viewers when video is not publicly playable', async () => {
    channelAccessService.getViewerAccessContext.mockResolvedValue({
      channelOwnerId: 'owner-1',
      channelStatus: ChannelStatus.ACTIVE,
      activeMembershipTierLevel: null,
    });

    await expect(
      service.assertCanWatch(
        buildVideo({
          visibility: VideoVisibility.PRIVATE,
        }),
        'viewer-1',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});

function buildVideo(
  overrides: Partial<ConstructorParameters<typeof VideoEntity>[0]> = {},
): VideoEntity {
  return new VideoEntity({
    id: 'video-1',
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: [],
    visibility: VideoVisibility.PUBLIC,
    status: VideoStatus.READY,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw/video.mp4',
    masterPlaylistKey: 'processed/master.m3u8',
    thumbnailUrl: null,
    durationSeconds: 120,
    resolutions: ['720p'],
    errorMessage: null,
    viewCount: 0,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}
