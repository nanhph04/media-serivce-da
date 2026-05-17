export interface InitVideoUploadResponse {
  videoId: string;
  status: string;
  rawFileKey: string;
  bucket: string;
  uploadUrl: string;
  thumbnailObjectKey: string | null;
  thumbnailBucket: string | null;
  thumbnailUploadUrl: string | null;
}
