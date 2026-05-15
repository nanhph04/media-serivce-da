import type { StudioVideoListItemResponse } from './studio-video-list-item.response';

export interface AdminVideoListItemResponse
  extends StudioVideoListItemResponse {
  ownerId: string;
}

export interface AdminVideosPageResponse {
  items: AdminVideoListItemResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
