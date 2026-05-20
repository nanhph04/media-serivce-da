export interface StartVideoUploadResponse {
  videoId: string;
  status: string;
  rawFileKey: string;
  bucket: string;
  uploadId: string;
  partSizeBytes: number;
  expiresAt: string;
  thumbnailObjectKey: string | null;
  thumbnailBucket: string | null;
  thumbnailUploadUrl: string | null;
}
