import type { VideoVisibility } from '../../domain/entities/video.entity';

export interface InitVideoUploadCommand {
  userId: string;
  channelId: string;
  title: string;
  description: string;
  categories: string[];
  visibility: VideoVisibility;
  price: number;
  requiredTierLevel: number | null;
}
