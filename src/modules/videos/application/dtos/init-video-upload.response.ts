export interface InitVideoUploadResponse {
  videoId: string;
  status: string;
  rawFileKey: string;
  bucket: string;
  uploadUrl: string;
}
