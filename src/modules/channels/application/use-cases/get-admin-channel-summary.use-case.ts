import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import type { GetAdminChannelSummaryQuery } from '../dtos/get-admin-channel-summary.query';
import type { AdminChannelSummaryResponse } from '../dtos/admin-channel-summary.response';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../../videos/domain/repositories/video.repository';

@Injectable()
export class GetAdminChannelSummaryUseCase extends BaseUseCase<
  GetAdminChannelSummaryQuery,
  AdminChannelSummaryResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {
    super();
  }

  async execute(
    query: GetAdminChannelSummaryQuery,
  ): Promise<AdminChannelSummaryResponse> {
    this.ensureNonEmpty(query.adminId, 'Admin id is required');
    this.ensureAdminRole(query.role);

    const [channelCounts, videoMetrics] = await Promise.all([
      this.channelRepository.getAdminChannelCounts(),
      this.videoRepository.getAdminChannelVideoMetrics(new Date()),
    ]);

    return {
      totalChannels: channelCounts.totalChannels,
      activeCreators30d: videoMetrics.activeCreators30d,
      eligibleForMembership: channelCounts.eligibleForMembership,
      membershipClosedByAdmin: channelCounts.membershipClosedByAdmin,
      uploadingNow: videoMetrics.uploadingNow,
    };
  }

  private ensureNonEmpty(value: string, message: string): void {
    if (!value.trim()) {
      throw new BadRequestException(message);
    }
  }

  private ensureAdminRole(role: string | undefined): void {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }
  }
}
