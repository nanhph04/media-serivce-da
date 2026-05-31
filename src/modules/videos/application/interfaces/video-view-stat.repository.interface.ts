export const VIDEO_VIEW_STAT_REPOSITORY = Symbol('VIDEO_VIEW_STAT_REPOSITORY');

export interface IVideoViewStatRepository {
  incrementDailyView(videoId: string, viewedAt: Date): Promise<void>;
}
