export const VIDEO_UPLOAD_SESSION_REPOSITORY = Symbol(
  'VIDEO_UPLOAD_SESSION_REPOSITORY',
);

export enum VideoUploadSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABORTED = 'aborted',
}

export interface VideoUploadPart {
  partNumber: number;
  etag: string;
  sizeBytes: number;
  uploadedAt: Date;
}

export interface VideoUploadSession {
  id: string;
  videoId: string;
  userId: string;
  rawFileKey: string;
  uploadId: string;
  partSizeBytes: number;
  fileName: string;
  fileSize: number;
  fileLastModified: Date;
  status: VideoUploadSessionStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  parts: VideoUploadPart[];
}

export interface CreateVideoUploadSessionInput {
  videoId: string;
  userId: string;
  rawFileKey: string;
  uploadId: string;
  partSizeBytes: number;
  fileName: string;
  fileSize: number;
  fileLastModified: Date;
  expiresAt: Date;
}

export interface IVideoUploadSessionRepository {
  create(input: CreateVideoUploadSessionInput): Promise<VideoUploadSession>;
  findByVideoAndUploadId(
    videoId: string,
    uploadId: string,
  ): Promise<VideoUploadSession | null>;
  savePart(input: {
    sessionId: string;
    partNumber: number;
    etag: string;
    sizeBytes: number;
  }): Promise<void>;
  markCompleted(sessionId: string): Promise<void>;
  markAborted(sessionId: string): Promise<void>;
  findActiveExpired(limit: number, now: Date): Promise<VideoUploadSession[]>;
}
