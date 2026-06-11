import type { IObjectStorageService } from '@shared/application/interfaces/object-storage.service.interface';
import type { VideoEntity } from '../../domain/entities/video.entity';
import type { VideoUploadSession } from '../../domain/repositories/video-upload-session.repository';
import {
  mapVideoStatusToJobFields,
  type VideoJobStatusFields,
} from './video-job-status';
import { buildOwnerThumbnailUrl } from './thumbnail-url';

export type StudioVideoUploadSessionSummary = Pick<
  VideoUploadSession,
  | 'uploadId'
  | 'partSizeBytes'
  | 'status'
  | 'expiresAt'
  | 'fileName'
  | 'fileSize'
>;

export interface StudioVideoListItemResponse extends VideoJobStatusFields {
  id: string;
  channelId: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  visibility: string;
  price: number;
  requiredTierLevel: number | null;
  thumbnailUrl: string | null;
  thumbnailSource: string;
  thumbnailStatus: string;
  durationSeconds: number | null;
  resolutions: string[];
  processingWarnings: string[];
  errorMessage: string | null;
  viewCount: number;
  publishedAt: Date | null;
  isDeleted: boolean;
  uploadId: string | null;
  partSizeBytes: number | null;
  uploadSessionStatus: string | null;
  uploadExpiresAt: Date | null;
  uploadFileName: string | null;
  uploadFileSize: number | null;
  deletedAt: Date | null;
  deletedBy: string | null;
  deleteReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function mapVideoEntityToStudioListItem(
  video: VideoEntity,
  objectStorageService?: IObjectStorageService,
  activeUploadSession?: StudioVideoUploadSessionSummary | null,
): StudioVideoListItemResponse {
  return {
    id: video.id,
    channelId: video.channelId,
    title: video.title,
    description: video.description,
    category: video.category.slug,
    tags: video.tags.map((tag) => tag.slug),
    status: video.status,
    visibility: video.visibility,
    price: video.price,
    requiredTierLevel: video.requiredTierLevel,
    thumbnailUrl: buildOwnerThumbnailUrl(video, objectStorageService),
    thumbnailSource: video.thumbnailSource,
    thumbnailStatus: video.thumbnailStatus,
    durationSeconds: video.durationSeconds,
    resolutions: video.resolutions,
    processingWarnings: video.processingWarnings,
    errorMessage: video.errorMessage,
    ...mapVideoStatusToJobFields({
      status: video.status,
      errorMessage: video.errorMessage,
      moderationDetails: video.moderationDetails,
    }),
    viewCount: video.viewCount,
    publishedAt: video.publishedAt,
    isDeleted: video.isDeleted,
    uploadId: activeUploadSession?.uploadId ?? null,
    partSizeBytes: activeUploadSession?.partSizeBytes ?? null,
    uploadSessionStatus: activeUploadSession?.status ?? null,
    uploadExpiresAt: activeUploadSession?.expiresAt ?? null,
    uploadFileName: activeUploadSession?.fileName ?? null,
    uploadFileSize: activeUploadSession?.fileSize ?? null,
    deletedAt: video.deletedAt,
    deletedBy: video.deletedBy,
    deleteReason: video.deleteReason,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
  };
}
