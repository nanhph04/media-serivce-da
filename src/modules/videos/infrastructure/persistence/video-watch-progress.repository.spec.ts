import { VideoWatchProgressEntity } from '../../domain/entities/video-watch-progress.entity';
import { VideoWatchProgressOrmEntity } from './video-watch-progress.orm-entity';
import { VideoWatchProgressRepository } from './video-watch-progress.repository';

describe('VideoWatchProgressRepository', () => {
  const execute = jest.fn();
  const orUpdate = jest.fn();
  const values = jest.fn();
  const into = jest.fn();
  const insert = jest.fn();
  const createQueryBuilder = jest.fn();
  const findOne = jest.fn();
  const ormRepository = {
    createQueryBuilder,
    findOne,
  };
  const repository = new VideoWatchProgressRepository(ormRepository as never);

  beforeEach(() => {
    jest.clearAllMocks();
    execute.mockResolvedValue(undefined);
    orUpdate.mockReturnValue({ execute });
    values.mockReturnValue({ orUpdate });
    into.mockReturnValue({ values });
    insert.mockReturnValue({ into });
    createQueryBuilder.mockReturnValue({ insert });
  });

  it('upserts progress atomically by user and video', async () => {
    const progress = buildProgress();

    await repository.save(progress);

    expect(createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(into).toHaveBeenCalledWith(VideoWatchProgressOrmEntity);
    expect(values).toHaveBeenCalledWith({
      id: 'progress-1',
      userId: 'viewer-1',
      videoId: 'video-1',
      channelId: 'channel-1',
      lastPositionSeconds: 42,
      durationSeconds: 120,
      lastWatchedAt: new Date('2026-01-01T00:10:00.000Z'),
      completedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:10:00.000Z'),
    });
    expect(orUpdate).toHaveBeenCalledWith(
      [
        'channel_id',
        'last_position_seconds',
        'duration_seconds',
        'last_watched_at',
        'completed_at',
        'updated_at',
      ],
      ['user_id', 'video_id'],
    );
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('maps a watch progress row to the domain entity', async () => {
    findOne.mockResolvedValue({
      id: 'progress-1',
      userId: 'viewer-1',
      videoId: 'video-1',
      channelId: 'channel-1',
      lastPositionSeconds: 42,
      durationSeconds: 120,
      lastWatchedAt: new Date('2026-01-01T00:10:00.000Z'),
      completedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:10:00.000Z'),
    });

    const progress = await repository.findByUserIdAndVideoId(
      'viewer-1',
      'video-1',
    );

    expect(findOne).toHaveBeenCalledWith({
      where: {
        userId: 'viewer-1',
        videoId: 'video-1',
      },
    });
    expect(progress).toBeInstanceOf(VideoWatchProgressEntity);
    expect(progress?.lastPositionSeconds).toBe(42);
  });
});

function buildProgress(): VideoWatchProgressEntity {
  return new VideoWatchProgressEntity({
    id: 'progress-1',
    userId: 'viewer-1',
    videoId: 'video-1',
    channelId: 'channel-1',
    lastPositionSeconds: 42,
    durationSeconds: 120,
    lastWatchedAt: new Date('2026-01-01T00:10:00.000Z'),
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:10:00.000Z'),
  });
}
