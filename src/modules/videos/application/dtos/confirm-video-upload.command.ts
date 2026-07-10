export interface ConfirmVideoUploadCommand {
  userId: string;
  traceId: string;
  videoId: string;
  uploadId: string;
  resolutions: string[];
  thumbnailObjectKey?: string | null;
}
