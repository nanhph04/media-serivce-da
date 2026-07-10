export interface ConfirmVideoUploadCommand {
  userId: string;
  videoId: string;
  uploadId: string;
  resolutions: string[];
  thumbnailObjectKey?: string | null;
}
