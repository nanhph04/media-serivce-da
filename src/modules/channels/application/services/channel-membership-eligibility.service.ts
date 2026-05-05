import { Inject, Injectable } from '@nestjs/common';
import {
  CHANNEL_MEMBERSHIP_ELIGIBILITY_CONFIG,
  type IChannelMembershipEligibilityConfig,
} from '@shared/application/interfaces/channel-membership-eligibility-config.interface';
import { NotFoundException } from '@shared/domain/exceptions/domain.exception';
import {
  VIDEO_QUERY_SERVICE,
  type IVideoQueryService,
} from '../../../videos/application/interfaces/video-query.service.interface';
import type { ChannelMembershipEligibilityResponse } from '../dtos/channel-membership-eligibility.response';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';

@Injectable()
export class ChannelMembershipEligibilityService {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
    @Inject(VIDEO_QUERY_SERVICE)
    private readonly videoQueryService: IVideoQueryService,
    @Inject(CHANNEL_MEMBERSHIP_ELIGIBILITY_CONFIG)
    private readonly config: IChannelMembershipEligibilityConfig,
  ) {}

  async getChannelEligibility(
    channelId: string,
  ): Promise<ChannelMembershipEligibilityResponse> {
    const channel = await this.channelRepository.findById(channelId);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    return this.buildEligibilityResponse(channelId);
  }

  async syncChannelEligibility(
    channelId: string,
  ): Promise<ChannelMembershipEligibilityResponse> {
    const channel = await this.channelRepository.findById(channelId);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    const eligibility = await this.buildEligibilityResponse(channelId);
    channel.syncMembershipEligibility(eligibility.isEligible);
    await this.channelRepository.update(channel);

    return eligibility;
  }

  private async buildEligibilityResponse(
    channelId: string,
  ): Promise<ChannelMembershipEligibilityResponse> {
    const metrics =
      await this.videoQueryService.getChannelMembershipEligibilityMetrics(
        channelId,
      );
    const minReadyVideoCount = this.config.getMinReadyVideosForMembership();
    const minTotalVideoViews = this.config.getMinTotalViewsForMembership();
    const missingRequirements: string[] = [];

    if (metrics.readyVideoCount < minReadyVideoCount) {
      missingRequirements.push(
        `Channel must have at least ${minReadyVideoCount} ready videos`,
      );
    }

    if (metrics.totalVideoViews < minTotalVideoViews) {
      missingRequirements.push(
        `Channel must have at least ${minTotalVideoViews} total views`,
      );
    }

    return {
      isEligible: missingRequirements.length === 0,
      readyVideoCount: metrics.readyVideoCount,
      minReadyVideoCount,
      totalVideoViews: metrics.totalVideoViews,
      minTotalVideoViews,
      missingRequirements,
    };
  }
}
