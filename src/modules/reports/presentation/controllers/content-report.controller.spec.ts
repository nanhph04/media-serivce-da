import { ContentReportTargetType } from '../../domain/entities/content-report.entity';
import { ContentReportController } from './content-report.controller';

describe('ContentReportController', () => {
  const reportChannelUseCase = {
    execute: jest.fn(),
  };
  const reportVideoUseCase = {
    execute: jest.fn(),
  };
  const controller = new ContentReportController(
    reportChannelUseCase as never,
    reportVideoUseCase as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps a video report request to the use case', async () => {
    reportVideoUseCase.execute.mockResolvedValue(buildReportResponse('video'));

    await controller.reportVideo('user-1', 'video-1', {
      reason: 'Violation',
      evidenceTimestampSeconds: 30,
    });

    expect(reportVideoUseCase.execute).toHaveBeenCalledWith({
      reporterUserId: 'user-1',
      videoId: 'video-1',
      reason: 'Violation',
      evidenceTimestampSeconds: 30,
    });
  });

  it('maps a channel report request to the use case', async () => {
    reportChannelUseCase.execute.mockResolvedValue(
      buildReportResponse('channel'),
    );

    await controller.reportChannel('user-1', 'channel-1', {
      reason: 'Violation',
      reportedVideoId: 'video-1',
      reportedVideoTitle: 'Ignored when id is present',
    });

    expect(reportChannelUseCase.execute).toHaveBeenCalledWith({
      reporterUserId: 'user-1',
      channelId: 'channel-1',
      reason: 'Violation',
      reportedVideoId: 'video-1',
      reportedVideoTitle: 'Ignored when id is present',
    });
  });
});

function buildReportResponse(targetType: 'video' | 'channel'): {
  id: string;
  targetType: ContentReportTargetType;
  reporterUserId: string;
  targetVideoId: string | null;
  targetChannelId: string;
  reason: string;
  evidenceTimestampSeconds: number | null;
  contextVideoId: string | null;
  contextVideoTitle: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
} {
  return {
    id: 'report-1',
    targetType:
      targetType === 'video'
        ? ContentReportTargetType.VIDEO
        : ContentReportTargetType.CHANNEL,
    reporterUserId: 'user-1',
    targetVideoId: targetType === 'video' ? 'video-1' : null,
    targetChannelId: 'channel-1',
    reason: 'Violation',
    evidenceTimestampSeconds: targetType === 'video' ? 30 : null,
    contextVideoId: targetType === 'channel' ? 'video-1' : null,
    contextVideoTitle: targetType === 'channel' ? 'Video' : null,
    status: 'pending',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}
