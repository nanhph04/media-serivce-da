export interface VideoUploadPartResponse {
  partNumber: number;
  etag: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface VideoUploadStatusResponse {
  videoId: string;
  uploadId: string;
  rawFileKey: string;
  partSizeBytes: number;
  fileName: string;
  fileSize: number;
  fileLastModified: string;
  status: string;
  expiresAt: string;
  parts: VideoUploadPartResponse[];
}

export interface VideoUploadPartUrlResponse {
  partNumber: number;
  uploadUrl: string;
  expiresAt: string;
}

export interface VideoUploadPartUrlsResponse {
  parts: VideoUploadPartUrlResponse[];
}

export interface VideoUploadPartCompletedResponse {
  videoId: string;
  uploadId: string;
  partNumber: number;
  completed: boolean;
}

export interface CompleteVideoUploadResponse {
  videoId: string;
  uploadId: string;
  rawFileKey: string;
  completed: boolean;
}
