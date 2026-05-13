export interface ReplaceVideoUploadResponse {
  videoId: string;
  status: string;
  rawFileKey: string;
  bucket: string;
  uploadUrl: string;
}
