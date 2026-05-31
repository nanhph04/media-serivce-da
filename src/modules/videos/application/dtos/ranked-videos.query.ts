export type VideoRankingMetric = 'views' | 'purchases';
export type VideoRankingPeriod = 'day' | 'week' | 'month';

export interface GetRankedVideosQuery {
  metric: VideoRankingMetric;
  period: VideoRankingPeriod;
  page: number;
  limit: number;
}
