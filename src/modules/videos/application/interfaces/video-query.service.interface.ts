export const VIDEO_QUERY_SERVICE = Symbol('VIDEO_QUERY_SERVICE');

export interface PublicChannelVideoSummary {
  id: string;
  title: string;
  categories: string[];
  status: string;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
}

export interface IVideoQueryService {
  getPublicVideoSummariesByChannel(
    channelId: string,
  ): Promise<PublicChannelVideoSummary[]>;
}
