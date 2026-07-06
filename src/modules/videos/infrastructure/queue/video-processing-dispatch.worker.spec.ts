import { VideoProcessingDispatchWorker } from './video-processing-dispatch.worker';
import { VideoProcessingDispatchStatus } from '../persistence/video-processing-dispatch.orm-entity';

describe('VideoProcessingDispatchWorker', () => {
  const dataSource = {
    query: jest.fn(),
  };
  const dispatcher = {
    enqueueTranscodeJob: jest.fn(),
  };
  const configService = {
    getNumber: jest.fn(),
  };
  const logger = {
    setContext: jest.fn(),
    logError: jest.fn(),
  };

  let worker: VideoProcessingDispatchWorker;

  beforeEach(() => {
    jest.clearAllMocks();
    configService.getNumber.mockImplementation(
      (key: string, defaultValue: number) => defaultValue,
    );
    dispatcher.enqueueTranscodeJob.mockResolvedValue(undefined);
    worker = new VideoProcessingDispatchWorker(
      dataSource as never,
      dispatcher as never,
      configService as never,
      logger as never,
    );
  });

  afterEach(() => {
    worker.onModuleDestroy();
  });

  it('enqueues claimed dispatches and marks them dispatched', async () => {
    dataSource.query
      .mockResolvedValueOnce([
        {
          id: 'dispatch-1',
          jobId: 'transcode-video-1',
          payload: {
            videoId: 'video-1',
            rawFileKey: 'uploads/raw/video.mp4',
            resolution: ['720p'],
            userId: 'owner-1',
          },
          attemptCount: 0,
        },
      ])
      .mockResolvedValueOnce(undefined);

    await expect(worker.dispatchPendingBatch()).resolves.toBe(1);

    expect(dispatcher.enqueueTranscodeJob).toHaveBeenCalledWith(
      {
        videoId: 'video-1',
        rawFileKey: 'uploads/raw/video.mp4',
        resolution: ['720p'],
        userId: 'owner-1',
      },
      { jobId: 'transcode-video-1' },
    );
    expect(dataSource.query).toHaveBeenLastCalledWith(
      expect.stringContaining('"status" = $1'),
      [VideoProcessingDispatchStatus.DISPATCHED, 'dispatch-1'],
    );
  });

  it('returns failed enqueue dispatches to pending with backoff', async () => {
    dataSource.query
      .mockResolvedValueOnce([
        {
          id: 'dispatch-1',
          jobId: 'transcode-video-1',
          payload: {
            videoId: 'video-1',
            rawFileKey: 'uploads/raw/video.mp4',
            resolution: ['720p'],
            userId: 'owner-1',
          },
          attemptCount: 2,
        },
      ])
      .mockResolvedValueOnce(undefined);
    dispatcher.enqueueTranscodeJob.mockRejectedValueOnce(new Error('redis down'));

    await expect(worker.dispatchPendingBatch()).resolves.toBe(1);

    expect(dataSource.query).toHaveBeenLastCalledWith(
      expect.stringContaining('"attempt_count" = "attempt_count" + 1'),
      [
        VideoProcessingDispatchStatus.PENDING,
        expect.any(Date),
        'redis down',
        'dispatch-1',
      ],
    );
    expect(logger.logError).toHaveBeenCalledWith(
      'Video processing dispatch failed',
      expect.any(Error),
      { dispatchId: 'dispatch-1', jobId: 'transcode-video-1' },
    );
  });
});
