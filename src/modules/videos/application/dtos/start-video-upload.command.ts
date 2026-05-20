import type { VideoVisibility } from '../../domain/entities/video.entity';

export interface StartVideoUploadCommand {
  userId: string;
  title: string;
  description: string;
  categoryId: string;
  tagIds: string[];
  visibility: VideoVisibility;
  price: number;
  requiredTierLevel: number | null;
  fileName: string;
  fileSize: number;
  fileLastModified: Date;
  thumbnailExtension?: string;
}
