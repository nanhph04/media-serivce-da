import type { PaginationDto } from '../../../../shared/presentation/dto/pagination.dto';
import type { VideoListItemResponse } from './video-list-item.response';

export interface VideosByCategoryResponse {
  items: VideoListItemResponse[];
  pagination: PaginationDto;
}
