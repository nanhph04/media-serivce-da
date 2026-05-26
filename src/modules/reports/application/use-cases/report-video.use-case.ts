import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../../videos/domain/repositories/video.repository';
import {
  ContentReportEntity,
  ContentReportTargetType,
} from '../../domain/entities/content-report.entity';
import {
  CONTENT_REPORT_REPOSITORY,
  type IContentReportRepository,
} from '../../domain/repositories/content-report.repository';
import type { ContentReportResponse } from '../dtos/content-report.response';
import type { ReportVideoCommand } from '../dtos/report-video.command';
import { toContentReportResponse } from '../mappers/content-report-response.mapper';

@Injectable()
export class ReportVideoUseCase extends BaseUseCase<
  ReportVideoCommand,
  ContentReportResponse
> {
  constructor(
    @Inject(CONTENT_REPORT_REPOSITORY)
    private readonly contentReportRepository: IContentReportRepository,
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {
    super();
  }

  async execute(command: ReportVideoCommand): Promise<ContentReportResponse> {
    const video = await this.videoRepository.findBasicById(command.videoId);
    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }

    if (
      command.evidenceTimestampSeconds !== undefined &&
      command.evidenceTimestampSeconds !== null &&
      video.durationSeconds !== null &&
      command.evidenceTimestampSeconds > video.durationSeconds
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.EVIDENCE_TIMESTAMP_EXCEEDS_VIDEO_DURATION,
      );
    }

    const existing =
      await this.contentReportRepository.findPendingByReporterAndTarget({
        reporterUserId: command.reporterUserId,
        targetType: ContentReportTargetType.VIDEO,
        targetVideoId: video.id,
        targetChannelId: video.channelId,
      });

    if (existing) {
      return toContentReportResponse(existing);
    }

    const report = ContentReportEntity.createVideoReport({
      reporterUserId: command.reporterUserId,
      targetVideoId: video.id,
      targetChannelId: video.channelId,
      reason: command.reason,
      evidenceTimestampSeconds: command.evidenceTimestampSeconds,
    });

    await this.contentReportRepository.save(report);
    return toContentReportResponse(report);
  }
}
