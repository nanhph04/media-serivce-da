export interface ConfirmVideoUploadCommand {
  userId: string;
  videoId: string;
  resolutions: string[];
  thumbnailObjectKey?: string | null;
}
