import type { VideoEntity } from '../entities/video.entity';

export const VIDEO_REPOSITORY = Symbol('VIDEO_REPOSITORY');

export interface IVideoRepository {
  save(video: VideoEntity): Promise<void>;
  findById(id: string): Promise<VideoEntity | null>;
  findPublicByChannelId(channelId: string): Promise<VideoEntity[]>;
  findLatestPublic(limit: number): Promise<VideoEntity[]>;
  findByCategory(category: string, limit: number): Promise<VideoEntity[]>;
  findByChannelIds(channelIds: string[], limit: number): Promise<VideoEntity[]>;
}
