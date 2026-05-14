import type { PaginationDto } from '../../../../shared/presentation/dto/pagination.dto';
import type { PurchasedVideoItemResponse } from './purchased-video-item.response';

export interface PurchasedVideosResponse {
  items: PurchasedVideoItemResponse[];
  pagination: PaginationDto;
}
