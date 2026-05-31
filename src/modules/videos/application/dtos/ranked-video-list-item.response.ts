import type { VideoListItemResponse } from './video-list-item.response';

export interface RankedVideoListItemResponse extends VideoListItemResponse {
  metricCount: number;
}
