import {
  VideoEntity,
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { HandleVideoProcessedSuccessUseCase } from './handle-video-processed-success.use-case';

describe('HandleVideoProcessedSuccessUseCase', () => {
  const videoRepository = {
    findById: jest.fn(),
    save: jest.fn(),
  };
  const eligibilityService = {
    syncChannelEligibility: jest.fn(),
  };
  const cacheService = {
    setIfNotExists: jest.fn(),
  };

  const useCase = new HandleVideoProcessedSuccessUseCase(
    videoRepository as never,
    eligibilityService as never,
    cacheService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('recalculates channel eligibility after video becomes ready', async () => {
    cacheService.setIfNotExists.mockResolvedValue(true);
    videoRepository.findById.mockResolvedValue(buildVideo());
    videoRepository.save.mockResolvedValue(undefined);
    eligibilityService.syncChannelEligibility.mockResolvedValue(undefined);

    await useCase.execute({
      eventId: 'event-1',
      data: {
        videoId: 'video-1',
        masterPlaylistKey: 'processed/master.m3u8',
        durationSeconds: 120,
        thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
        resolution: ['1080p'],
      },
    });

    expect(videoRepository.save).toHaveBeenCalled();
    expect(eligibilityService.syncChannelEligibility).toHaveBeenCalledWith(
      'channel-1',
    );
  });
});

function buildVideo(): VideoEntity {
  return VideoEntity.create({
    channelId: 'channel-1',
    ownerId: 'owner-1',
    title: 'Video',
    description: 'Description',
    category: [],
    visibility: VideoVisibility.PUBLIC,
    price: 0,
    requiredTierLevel: null,
    rawFileKey: 'raw/video.mp4',
  });
}
