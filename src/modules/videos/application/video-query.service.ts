import { Inject, Injectable } from '@nestjs/common';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../domain/repositories/video.repository';
import type {
  IVideoQueryService,
  PublicChannelVideoSummary,
} from './interfaces/video-query.service.interface';

@Injectable()
export class VideoQueryService implements IVideoQueryService {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {}

  async getPublicVideoSummariesByChannel(
    channelId: string,
  ): Promise<PublicChannelVideoSummary[]> {
    const videos = await this.videoRepository.findPublicByChannelId(channelId);

    return videos.map((video) => ({
      id: video.id,
      title: video.title,
      category: video.category,
      status: video.status,
      thumbnailUrl: video.thumbnailUrl,
      publishedAt: video.publishedAt,
    }));
  }
}
