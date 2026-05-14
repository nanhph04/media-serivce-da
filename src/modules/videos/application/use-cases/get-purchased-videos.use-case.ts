import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import type { GetPurchasedVideosQuery } from '../dtos/purchased-videos.query';
import type { PurchasedVideoItemResponse } from '../dtos/purchased-video-item.response';
import type { PurchasedVideosResponse } from '../dtos/purchased-videos.response';
import {
  type PurchasedVideoItemReadModel,
  type IVideoPurchaseUnlockRepository,
  VIDEO_PURCHASE_UNLOCK_REPOSITORY,
} from '../../domain/repositories/video-purchase-unlock.repository';

@Injectable()
export class GetPurchasedVideosUseCase extends BaseUseCase<
  GetPurchasedVideosQuery,
  PurchasedVideosResponse
> {
  constructor(
    @Inject(VIDEO_PURCHASE_UNLOCK_REPOSITORY)
    private readonly videoPurchaseUnlockRepository: IVideoPurchaseUnlockRepository,
  ) {
    super();
  }

  async execute(
    query: GetPurchasedVideosQuery,
  ): Promise<PurchasedVideosResponse> {
    const result =
      await this.videoPurchaseUnlockRepository.findPurchasedByUserId({
        userId: query.userId,
        page: query.page,
        limit: query.limit,
    });

    return {
      items: result.items.map((item) => this.toPurchasedVideoItem(item)),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages:
          result.total === 0 ? 0 : Math.ceil(result.total / query.limit),
      },
    };
  }

  private toPurchasedVideoItem(
    item: PurchasedVideoItemReadModel,
  ): PurchasedVideoItemResponse {
    return {
      videoId: item.videoId,
      channelId: item.channelId,
      channelName: item.channelName,
      title: item.title,
      description: item.description,
      thumbnailUrl: item.thumbnailUrl,
      durationSeconds: item.durationSeconds,
      categories: item.categories,
      tags: item.tags,
      priceCoin: item.priceCoin,
      purchasedAt: item.purchasedAt,
      publishedAt: item.publishedAt,
      viewCount: item.viewCount,
      accessStatus: item.accessStatus,
    };
  }
}
