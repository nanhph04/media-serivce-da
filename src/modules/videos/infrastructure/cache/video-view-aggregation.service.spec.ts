import { VideoViewAggregationService } from './video-view-aggregation.service';

describe('VideoViewAggregationService', () => {
  const state = {
    values: new Map<string, number>(),
    dirty: new Set<string>(),
    events: new Set<string>(),
  };
  const redis = {
    eval: jest.fn(),
    smembers: jest.fn(),
  };
  const videoViewConfig = {
    getVideoViewDedupeTtlSeconds: jest.fn(() => 1800),
  };

  let service: VideoViewAggregationService;

  beforeEach(() => {
    jest.clearAllMocks();
    state.values.clear();
    state.dirty.clear();
    state.events.clear();

    redis.eval.mockImplementation(async (script: string, _keys: number, ...args: string[]) => {
      if (script.includes("SADD', KEYS[3], ARGV[2]")) {
        const [eventKey, pendingKey, _dirtyKey, _ttl, videoId] = args;
        if (state.events.has(eventKey)) {
          return 0;
        }

        state.events.add(eventKey);
        state.values.set(pendingKey, (state.values.get(pendingKey) ?? 0) + 1);
        state.dirty.add(videoId);
        return 1;
      }

      if (script.includes("RENAME', KEYS[1], KEYS[2]")) {
        const [pendingKey, inflightKey] = args;
        if (state.values.has(inflightKey) || !state.values.has(pendingKey)) {
          return 0;
        }

        const value = state.values.get(pendingKey) ?? 0;
        state.values.delete(pendingKey);
        state.values.set(inflightKey, value);
        return value;
      }

      if (script.includes("SREM', KEYS[3], ARGV[1]")) {
        const [pendingKey, inflightKey, _dirtyKey, videoId] = args;
        state.values.delete(inflightKey);
        if (!state.values.has(pendingKey)) {
          state.dirty.delete(videoId);
        }
        return 1;
      }

      if (script.includes("INCRBY', KEYS[1], inflight")) {
        const [pendingKey, inflightKey, _dirtyKey, videoId] = args;
        const inflight = state.values.get(inflightKey);
        if (inflight === undefined) {
          return 0;
        }

        state.values.set(pendingKey, (state.values.get(pendingKey) ?? 0) + inflight);
        state.values.delete(inflightKey);
        state.dirty.add(videoId);
        return inflight;
      }

      throw new Error(`Unhandled script: ${script}`);
    });
    redis.smembers.mockImplementation(async () => [...state.dirty]);
    service = new VideoViewAggregationService(
      redis as never,
      videoViewConfig as never,
    );
  });

  it('records a new viewed event once and adds the video to the dirty set', async () => {
    await expect(service.recordViewedEvent('event-1', 'video-1')).resolves.toBe(
      true,
    );
    await expect(service.recordViewedEvent('event-1', 'video-1')).resolves.toBe(
      false,
    );

    expect(await service.getDirtyVideoIds()).toEqual(['video-1']);
  });

  it('claims pending deltas by moving them into the inflight bucket', async () => {
    await service.recordViewedEvent('event-1', 'video-1');
    await service.recordViewedEvent('event-2', 'video-1');

    await expect(service.claimPendingViewDelta('video-1')).resolves.toBe(2);
    await expect(service.claimPendingViewDelta('video-1')).resolves.toBeNull();
  });

  it('restores inflight deltas back to pending on failure', async () => {
    await service.recordViewedEvent('event-1', 'video-1');
    await service.claimPendingViewDelta('video-1');

    await service.restoreInflightViewDelta('video-1');

    await expect(service.claimPendingViewDelta('video-1')).resolves.toBe(1);
  });

  it('cleans the dirty set after a successful flush with no new pending views', async () => {
    await service.recordViewedEvent('event-1', 'video-1');
    await service.claimPendingViewDelta('video-1');

    await service.completeFlush('video-1');

    await expect(service.getDirtyVideoIds()).resolves.toEqual([]);
  });
});
