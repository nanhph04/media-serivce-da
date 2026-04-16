import type { VideoVisibility } from '../../domain/entities/video.entity';

export interface InitVideoUploadCommand {
  userId: string;
  channelId: string;
  title: string;
  description: string;
  category: string;
  visibility: VideoVisibility;
  price: number;
  requiredTierLevel: number | null;
}
