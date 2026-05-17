import type { VideoVisibility } from '../../domain/entities/video.entity';

export interface InitVideoUploadCommand {
  userId: string;
  title: string;
  description: string;
  categoryId: string;
  tagIds: string[];
  visibility: VideoVisibility;
  price: number;
  requiredTierLevel: number | null;
  thumbnailExtension?: string;
}
