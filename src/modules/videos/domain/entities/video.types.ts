import type { Category } from '../../../categories/domain/entities/category.entity';
import type { Tag } from '../../../tags/domain/entities/tag.entity';

export enum VideoStatus {
  DRAFT = 'draft',
  PENDING_MODERATION = 'pending_moderation',
  PROCESSING = 'processing',
  PENDING_MANUAL_REVIEW = 'pending_manual_review',
  REJECTED = 'rejected',
  READY = 'ready',
  FAILED = 'failed',
  BANNED = 'banned',
}

export enum VideoVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum VideoDeletionStatus {
  ACTIVE = 'active',
  PENDING_DELETE = 'pending_delete',
  READY_FOR_HARD_DELETE = 'ready_for_hard_delete',
  STORAGE_DELETED = 'storage_deleted',
}

export enum VideoThumbnailSource {
  AUTO = 'auto',
  CUSTOM = 'custom',
}

export enum VideoThumbnailStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

export interface VideoModerationDetails {
  reason: string;
  confidence: number;
  evidenceTimestampSeconds: number | null;
  label?: string | null;
  safeScore?: number | null;
  nsfwScore?: number | null;
  sampledFrameCount?: number | null;
  thresholds?: {
    manual: number;
    reject: number;
  } | null;
}

export interface VideoProps {
  id: string;
  channelId: string;
  ownerId: string;
  title: string;
  description: string;
  category: Category;
  tags: Tag[];
  visibility: VideoVisibility;
  status: VideoStatus;
  price: number;
  requiredTierLevel: number | null;
  rawFileKey: string;
  masterPlaylistKey: string | null;
  thumbnailObjectKey: string | null;
  thumbnailUrl: string | null;
  thumbnailSource: VideoThumbnailSource;
  thumbnailStatus: VideoThumbnailStatus;
  thumbnailGeneratedAt: Date | null;
  thumbnailError: string | null;
  durationSeconds: number | null;
  resolutions: string[];
  processingWarnings?: string[];
  errorMessage: string | null;
  moderationDetails?: VideoModerationDetails | null;
  viewCount: number;
  publishedAt: Date | null;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  deletedBy?: string | null;
  deleteReason?: string | null;
  deletionStatus?: VideoDeletionStatus;
  deleteRequestedAt?: Date | null;
  refundCompletedAt?: Date | null;
  refundSummary?: Record<string, unknown> | null;
  storageDeletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  statusChangedAt?: Date;
}
