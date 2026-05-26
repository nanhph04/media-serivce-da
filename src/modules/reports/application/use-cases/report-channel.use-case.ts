import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../../channels/domain/repositories/channel.repository';
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
import type { ReportChannelCommand } from '../dtos/report-channel.command';
import { toContentReportResponse } from '../mappers/content-report-response.mapper';

@Injectable()
export class ReportChannelUseCase extends BaseUseCase<
  ReportChannelCommand,
  ContentReportResponse
> {
  constructor(
    @Inject(CONTENT_REPORT_REPOSITORY)
    private readonly contentReportRepository: IContentReportRepository,
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {
    super();
  }

  async execute(command: ReportChannelCommand): Promise<ContentReportResponse> {
    const channel = await this.channelRepository.findById(command.channelId);
    if (!channel) {
      throw new NotFoundException(ERROR_MESSAGES.CHANNEL_NOT_FOUND);
    }

    const existing =
      await this.contentReportRepository.findPendingByReporterAndTarget({
        reporterUserId: command.reporterUserId,
        targetType: ContentReportTargetType.CHANNEL,
        targetChannelId: channel.id,
      });

    if (existing) {
      return toContentReportResponse(existing);
    }

    const context = await this.resolveContextVideo(command, channel.id);
    const report = ContentReportEntity.createChannelReport({
      reporterUserId: command.reporterUserId,
      targetChannelId: channel.id,
      reason: command.reason,
      contextVideoId: context.videoId,
      contextVideoTitle: context.videoTitle,
    });

    await this.contentReportRepository.save(report);
    return toContentReportResponse(report);
  }

  private async resolveContextVideo(
    command: ReportChannelCommand,
    channelId: string,
  ): Promise<{ videoId: string | null; videoTitle: string | null }> {
    const reportedVideoId = command.reportedVideoId?.trim();
    if (reportedVideoId) {
      const video = await this.videoRepository.findBasicById(reportedVideoId);
      if (!video) {
        throw new NotFoundException(ERROR_MESSAGES.REPORTED_VIDEO_NOT_FOUND);
      }

      if (video.channelId !== channelId) {
        throw new BadRequestException(
          ERROR_MESSAGES.REPORTED_VIDEO_NOT_BELONG_TO_CHANNEL,
        );
      }

      return {
        videoId: video.id,
        videoTitle: video.title,
      };
    }

    const reportedVideoTitle = command.reportedVideoTitle?.trim();
    return {
      videoId: null,
      videoTitle: reportedVideoTitle || null,
    };
  }
}
