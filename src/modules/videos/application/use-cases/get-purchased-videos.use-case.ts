import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  mapVideoEntityToListItem,
  type VideoListItemResponse,
} from '../dtos/video-list-item.response';
import type { GetPurchasedVideosQuery } from '../dtos/purchased-videos.query';
import type { PurchasedVideosResponse } from '../dtos/purchased-videos.response';
import {
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
      items: result.items.map(
        (video): VideoListItemResponse => mapVideoEntityToListItem(video),
      ),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / query.limit),
      },
    };
  }
}
