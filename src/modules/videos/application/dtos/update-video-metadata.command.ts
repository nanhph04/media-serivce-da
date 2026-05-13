export interface UpdateVideoMetadataCommand {
  userId: string;
  videoId: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string | null;
  categoryId?: string;
  tagIds?: string[];
}
