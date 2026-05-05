import { VideoRepository } from './video.repository';

describe('VideoRepository', () => {
  const execute = jest.fn();
  const where = jest.fn();
  const addSelect = jest.fn();
  const getRawOne = jest.fn();
  const setParameter = jest.fn();
  const set = jest.fn();
  const update = jest.fn();
  const createQueryBuilder = jest.fn();
  const findOne = jest.fn();
  const ormRepository = {
    createQueryBuilder,
    findOne,
  };

  const repository = new VideoRepository(ormRepository as never);

  beforeEach(() => {
    jest.clearAllMocks();
    execute.mockResolvedValue(undefined);
    where.mockReturnValue({ execute });
    set.mockReturnValue({ where });
    update.mockReturnValue({ set });
    createQueryBuilder.mockReturnValue({ update });
    addSelect.mockReturnValue({
      where,
    });
    where.mockReturnValue({
      execute,
      setParameter,
    });
    setParameter.mockReturnValue({
      getRawOne,
    });
  });

  it('increments view_count atomically for the target video', async () => {
    await repository.incrementViewCount('video-1');

    expect(update).toHaveBeenCalled();
    expect(set).toHaveBeenCalledWith({
      viewCount: expect.any(Function),
      updatedAt: expect.any(Function),
    });
    expect(where).toHaveBeenCalledWith('id = :videoId', {
      videoId: 'video-1',
    });
    expect(execute).toHaveBeenCalledTimes(1);

    const setArg = set.mock.calls[0][0] as {
      viewCount: () => string;
      updatedAt: () => string;
    };
    expect(setArg.viewCount()).toBe('"view_count" + 1');
    expect(setArg.updatedAt()).toBe('CURRENT_TIMESTAMP');
  });

  it('loads basic video data without joining category relations', async () => {
    findOne.mockResolvedValue({
      id: 'video-1',
      channelId: 'channel-1',
      ownerId: 'owner-1',
      title: 'Video',
      description: 'Description',
      visibility: 'public',
      status: 'ready',
      price: 0,
      requiredTierLevel: null,
      rawFileKey: 'raw/video.mp4',
      masterPlaylistKey: 'processed/master.m3u8',
      thumbnailUrl: null,
      durationSeconds: 120,
      resolutions: ['720p'],
      errorMessage: null,
      viewCount: 0,
      publishedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const video = await repository.findBasicById('video-1');

    expect(findOne).toHaveBeenCalledWith({ where: { id: 'video-1' } });
    expect(video?.category).toEqual([]);
  });

  it('aggregates ready video count and total views for channel eligibility', async () => {
    const select = jest.fn().mockReturnValue({ addSelect });
    addSelect.mockReturnValue({ where });
    where.mockReturnValue({ setParameter });
    setParameter.mockReturnValue({ getRawOne });
    getRawOne.mockResolvedValue({
      readyVideoCount: '5',
      totalVideoViews: '1000',
    });
    createQueryBuilder.mockReturnValue({ select });

    await expect(
      repository.getChannelMembershipEligibilityMetrics('channel-1'),
    ).resolves.toEqual({
      readyVideoCount: 5,
      totalVideoViews: 1000,
    });
  });
});
