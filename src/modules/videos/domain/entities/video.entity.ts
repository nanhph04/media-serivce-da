import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  BadRequestException,
  ConflictException,
} from '@shared/domain/exceptions/domain.exception';
import type { Category } from '../../../categories/domain/entities/category.entity';
import type { Tag } from '../../../tags/domain/entities/tag.entity';
import {
  normalizeVideoProcessingWarnings,
  normalizeVideoResolutions,
  validateVideoMetadata,
  validateVideoTitle,
} from './video.validators';
import {
  VideoDeletionStatus,
  VideoStatus,
  VideoThumbnailSource,
  VideoThumbnailStatus,
  VideoVisibility,
} from './video.types';
import type { VideoModerationDetails, VideoProps } from './video.types';

export {
  VideoDeletionStatus,
  VideoStatus,
  VideoThumbnailSource,
  VideoThumbnailStatus,
  VideoVisibility,
} from './video.types';
export type { VideoModerationDetails, VideoProps } from './video.types';

export class VideoEntity {
  constructor(private readonly props: VideoProps) {}

  get id(): string {
    return this.props.id;
  }

  get channelId(): string {
    return this.props.channelId;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get category(): Category {
    const category = this.props.category as Category | Category[];
    return Array.isArray(category) ? category[0] : category;
  }

  get tags(): Tag[] {
    return this.props.tags ?? [];
  }

  get visibility(): VideoVisibility {
    return this.props.visibility;
  }

  get status(): VideoStatus {
    return this.props.status;
  }

  get price(): number {
    return this.props.price;
  }

  get requiredTierLevel(): number | null {
    return this.props.requiredTierLevel;
  }

  get rawFileKey(): string {
    return this.props.rawFileKey;
  }

  get masterPlaylistKey(): string | null {
    return this.props.masterPlaylistKey;
  }

  get thumbnailUrl(): string | null {
    return this.props.thumbnailUrl;
  }

  get thumbnailObjectKey(): string | null {
    return this.props.thumbnailObjectKey;
  }

  get thumbnailSource(): VideoThumbnailSource {
    return this.props.thumbnailSource;
  }

  get thumbnailStatus(): VideoThumbnailStatus {
    return this.props.thumbnailStatus;
  }

  get thumbnailGeneratedAt(): Date | null {
    return this.props.thumbnailGeneratedAt;
  }

  get thumbnailError(): string | null {
    return this.props.thumbnailError;
  }

  get durationSeconds(): number | null {
    return this.props.durationSeconds;
  }

  get resolutions(): string[] {
    return this.props.resolutions;
  }

  get processingWarnings(): string[] {
    return this.props.processingWarnings ?? [];
  }

  get errorMessage(): string | null {
    return this.props.errorMessage;
  }

  get viewCount(): number {
    return this.props.viewCount;
  }

  get publishedAt(): Date | null {
    return this.props.publishedAt;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted ?? false;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null;
  }

  get deletedBy(): string | null {
    return this.props.deletedBy ?? null;
  }

  get deleteReason(): string | null {
    return this.props.deleteReason ?? null;
  }

  get deletionStatus(): VideoDeletionStatus {
    return (
      this.props.deletionStatus ??
      (this.props.isDeleted
        ? VideoDeletionStatus.PENDING_DELETE
        : VideoDeletionStatus.ACTIVE)
    );
  }

  get deleteRequestedAt(): Date | null {
    return this.props.deleteRequestedAt ?? this.props.deletedAt ?? null;
  }

  get refundCompletedAt(): Date | null {
    return this.props.refundCompletedAt ?? null;
  }

  get refundSummary(): Record<string, unknown> | null {
    return this.props.refundSummary ?? null;
  }

  get storageDeletedAt(): Date | null {
    return this.props.storageDeletedAt ?? null;
  }

  get isDeletePending(): boolean {
    return this.deletionStatus === VideoDeletionStatus.PENDING_DELETE;
  }

  get isReadyForHardDelete(): boolean {
    return this.deletionStatus === VideoDeletionStatus.READY_FOR_HARD_DELETE;
  }

  get isStorageDeleted(): boolean {
    return this.deletionStatus === VideoDeletionStatus.STORAGE_DELETED;
  }

  get isAvailableForPlayback(): boolean {
    return this.deletionStatus === VideoDeletionStatus.ACTIVE;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get statusChangedAt(): Date {
    return this.props.statusChangedAt ?? this.props.updatedAt;
  }

  static create(input: {
    channelId: string;
    ownerId: string;
    title: string;
    description: string;
    category: Category;
    tags: Tag[];
    visibility: VideoVisibility;
    price: number;
    requiredTierLevel: number | null;
    rawFileKey: string;
  }): VideoEntity {
    validateVideoMetadata({
      title: input.title,
      price: input.price,
      requiredTierLevel: input.requiredTierLevel,
    });

    const now = new Date();
    return new VideoEntity({
      id: crypto.randomUUID(),
      channelId: input.channelId,
      ownerId: input.ownerId,
      title: input.title,
      description: input.description,
      category: input.category,
      tags: input.tags,
      visibility: input.visibility,
      status: VideoStatus.DRAFT,
      price: input.price,
      requiredTierLevel: input.requiredTierLevel,
      rawFileKey: input.rawFileKey,
      masterPlaylistKey: null,
      thumbnailObjectKey: null,
      thumbnailUrl: null,
      thumbnailSource: VideoThumbnailSource.AUTO,
      thumbnailStatus: VideoThumbnailStatus.PENDING,
      thumbnailGeneratedAt: null,
      thumbnailError: null,
      durationSeconds: null,
      resolutions: [],
      processingWarnings: [],
      errorMessage: null,
      moderationDetails: null,
      viewCount: 0,
      publishedAt: null,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      deleteReason: null,
      deletionStatus: VideoDeletionStatus.ACTIVE,
      deleteRequestedAt: null,
      refundCompletedAt: null,
      refundSummary: null,
      storageDeletedAt: null,
      createdAt: now,
      updatedAt: now,
      statusChangedAt: now,
    });
  }

  markProcessing(input?: { resolutions?: string[] }): void {
    if (
      this.props.status !== VideoStatus.DRAFT &&
      this.props.status !== VideoStatus.PENDING_MODERATION
    ) {
      throw new ConflictException(ERROR_MESSAGES.VIDEO_CANNOT_MARK_PROCESSING);
    }
    if (input?.resolutions !== undefined) {
      this.setRequestedResolutions(input.resolutions);
    }
    this.changeStatus(VideoStatus.PROCESSING);
  }

  markPendingModeration(input: { resolutions: string[] }): void {
    this.assertDraftUploadMutable();
    this.setRequestedResolutions(input.resolutions);
    this.changeStatus(VideoStatus.PENDING_MODERATION);
    this.props.processingWarnings = [];
    this.props.errorMessage = null;
  }

  replaceDraftRawFile(rawFileKey: string): void {
    this.assertDraftUploadMutable();
    this.props.rawFileKey = rawFileKey;
    this.props.errorMessage = null;
    this.touch();
  }

  markCustomThumbnailReady(input: {
    objectKey: string;
    url: string;
    generatedAt?: Date;
  }): void {
    this.assertDraftUploadMutable();
    this.props.thumbnailSource = VideoThumbnailSource.CUSTOM;
    this.props.thumbnailStatus = VideoThumbnailStatus.READY;
    this.props.thumbnailObjectKey = input.objectKey;
    this.props.thumbnailUrl = input.url;
    this.props.thumbnailGeneratedAt = input.generatedAt ?? new Date();
    this.props.thumbnailError = null;
    this.touch();
  }

  markAutoThumbnailProcessing(): void {
    if (this.props.thumbnailSource === VideoThumbnailSource.CUSTOM) {
      return;
    }

    this.props.thumbnailSource = VideoThumbnailSource.AUTO;
    this.props.thumbnailStatus = VideoThumbnailStatus.PROCESSING;
    this.props.thumbnailError = null;
    this.touch();
  }

  markAutoThumbnailReady(input: {
    objectKey: string;
    url: string;
    generatedAt?: Date;
  }): void {
    if (this.props.thumbnailSource === VideoThumbnailSource.CUSTOM) {
      return;
    }

    this.props.thumbnailSource = VideoThumbnailSource.AUTO;
    this.props.thumbnailStatus = VideoThumbnailStatus.READY;
    this.props.thumbnailObjectKey = input.objectKey;
    this.props.thumbnailUrl = input.url;
    this.props.thumbnailGeneratedAt = input.generatedAt ?? new Date();
    this.props.thumbnailError = null;
    this.touch();
  }

  markAutoThumbnailFailed(errorMessage: string): void {
    if (this.props.thumbnailSource === VideoThumbnailSource.CUSTOM) {
      return;
    }

    this.props.thumbnailSource = VideoThumbnailSource.AUTO;
    this.props.thumbnailStatus = VideoThumbnailStatus.FAILED;
    this.props.thumbnailError = errorMessage;
    this.touch();
  }

  assertDraftUploadMutable(): void {
    if (this.props.status !== VideoStatus.DRAFT) {
      throw new ConflictException(ERROR_MESSAGES.VIDEO_NOT_DRAFT);
    }
  }

  get moderationDetails(): VideoModerationDetails | null {
    return this.props.moderationDetails ?? null;
  }

  markPendingManualReview(
    reason: string,
    moderationDetails: VideoModerationDetails | null = null,
    input?: { resolutions?: string[] },
  ): void {
    if (input?.resolutions !== undefined) {
      this.setRequestedResolutions(input.resolutions);
    }
    this.changeStatus(VideoStatus.PENDING_MANUAL_REVIEW);
    this.props.errorMessage = reason;
    this.props.moderationDetails = moderationDetails;
  }

  markRejected(
    reason: string,
    moderationDetails: VideoModerationDetails | null = null,
  ): void {
    this.changeStatus(VideoStatus.REJECTED);
    this.props.errorMessage = reason;
    this.props.moderationDetails = moderationDetails;
  }

  approveManualReview(): void {
    if (this.props.status !== VideoStatus.PENDING_MANUAL_REVIEW) {
      throw new ConflictException(
        ERROR_MESSAGES.VIDEO_NOT_PENDING_MANUAL_REVIEW,
      );
    }

    this.changeStatus(VideoStatus.READY);
    this.props.errorMessage = null;
    this.props.moderationDetails = null;
    this.props.publishedAt = new Date();
  }

  approveManualReviewForProcessing(): void {
    if (this.props.status !== VideoStatus.PENDING_MANUAL_REVIEW) {
      throw new ConflictException(
        ERROR_MESSAGES.VIDEO_NOT_PENDING_MANUAL_REVIEW,
      );
    }
    if (this.props.resolutions.length === 0) {
      throw new ConflictException(
        ERROR_MESSAGES.VIDEO_NO_REQUESTED_RESOLUTIONS,
      );
    }

    this.changeStatus(VideoStatus.PROCESSING);
    this.props.errorMessage = null;
  }

  rejectManualReview(reason: string): void {
    const normalizedReason = reason.trim();

    if (!normalizedReason) {
      throw new BadRequestException(
        ERROR_MESSAGES.VIDEO_REJECTION_REASON_REQUIRED,
      );
    }

    if (this.props.status !== VideoStatus.PENDING_MANUAL_REVIEW) {
      throw new ConflictException(
        ERROR_MESSAGES.VIDEO_NOT_PENDING_MANUAL_REVIEW,
      );
    }

    this.markRejected(normalizedReason, {
      reason: normalizedReason,
      confidence: 1,
      evidenceTimestampSeconds: null,
    });
  }

  markReady(input: {
    masterPlaylistKey: string;
    thumbnailUrl?: string | null;
    durationSeconds?: number | null;
    resolutions?: string[];
    processingWarnings?: string[];
  }): void {
    if (this.props.status !== VideoStatus.PROCESSING) {
      throw new ConflictException(
        ERROR_MESSAGES.VIDEO_PROCESSING_REQUIRED_FOR_READY,
      );
    }

    const masterPlaylistKey = input.masterPlaylistKey.trim();
    if (!masterPlaylistKey) {
      throw new BadRequestException(ERROR_MESSAGES.VIDEO_MASTER_PLAYLIST_REQUIRED);
    }

    if (
      input.durationSeconds !== undefined &&
      input.durationSeconds !== null &&
      input.durationSeconds <= 0
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.VIDEO_DURATION_MUST_BE_POSITIVE,
      );
    }

    const resolutions =
      input.resolutions === undefined
        ? this.props.resolutions
        : normalizeVideoResolutions(input.resolutions);

    this.changeStatus(VideoStatus.READY);
    this.props.masterPlaylistKey = masterPlaylistKey;
    if (input.thumbnailUrl !== undefined && !this.props.thumbnailUrl) {
      this.props.thumbnailUrl = input.thumbnailUrl;
    }
    this.props.durationSeconds =
      input.durationSeconds ?? this.props.durationSeconds;
    this.props.resolutions = resolutions;
    this.props.processingWarnings = this.normalizeProcessingWarnings(
      input.processingWarnings ?? [],
    );
    this.props.errorMessage = null;
    this.props.moderationDetails = null;
    this.props.publishedAt = new Date();
  }

  updateMetadata(input: {
    title?: string;
    description?: string;
    thumbnailUrl?: string | null;
    category?: Category;
    tags?: Tag[];
    visibility?: VideoVisibility;
    price?: number;
    requiredTierLevel?: number | null;
  }): void {
    if (input.title !== undefined) {
      validateVideoTitle(input.title);
      this.props.title = input.title;
    }

    if (input.description !== undefined) {
      this.props.description = input.description;
    }

    if (input.thumbnailUrl !== undefined) {
      this.props.thumbnailUrl = input.thumbnailUrl;
    }

    if (input.category !== undefined) {
      this.props.category = input.category;
    }

    if (input.tags !== undefined) {
      this.props.tags = input.tags;
    }

    if (input.visibility !== undefined) {
      this.props.visibility = input.visibility;
    }

    if (input.price !== undefined || input.requiredTierLevel !== undefined) {
      const nextPrice = input.price ?? this.props.price;
      const nextRequiredTierLevel =
        input.requiredTierLevel === undefined
          ? this.props.requiredTierLevel
          : input.requiredTierLevel;

      validateVideoMetadata({
        title: this.props.title,
        price: nextPrice,
        requiredTierLevel: nextRequiredTierLevel,
      });
      this.props.price = nextPrice;
      this.props.requiredTierLevel = nextRequiredTierLevel;
    }

    this.touch();
  }

  markFailed(errorMessage: string): void {
    if (
      this.props.status !== VideoStatus.PENDING_MODERATION &&
      this.props.status !== VideoStatus.PROCESSING
    ) {
      throw new ConflictException(ERROR_MESSAGES.VIDEO_CANNOT_MARK_FAILED);
    }

    const normalizedErrorMessage = errorMessage.trim();
    if (!normalizedErrorMessage) {
      throw new BadRequestException(ERROR_MESSAGES.VIDEO_FAILURE_REASON_REQUIRED);
    }

    this.changeStatus(VideoStatus.FAILED);
    this.props.errorMessage = normalizedErrorMessage;
  }

  unpublish(input: { deletedBy: string; reason: string }): void {
    if (this.props.status !== VideoStatus.READY) {
      throw new ConflictException(
        ERROR_MESSAGES.VIDEO_READY_REQUIRED_FOR_UNPUBLISH,
      );
    }
    if (this.deletionStatus !== VideoDeletionStatus.ACTIVE) {
      throw new ConflictException(
        ERROR_MESSAGES.VIDEO_DELETE_ALREADY_REQUESTED,
      );
    }
    this.props.isDeleted = true;
    this.props.deletedAt = new Date();
    this.props.deletedBy = input.deletedBy;
    this.props.deleteReason = input.reason;
    this.props.deletionStatus = VideoDeletionStatus.PENDING_DELETE;
    this.props.deleteRequestedAt = this.props.deletedAt;
    this.touch();
  }

  markRefundCompleted(input: {
    completedAt: Date;
    summary: Record<string, unknown>;
  }): void {
    if (this.deletionStatus === VideoDeletionStatus.READY_FOR_HARD_DELETE) {
      return;
    }

    if (this.deletionStatus !== VideoDeletionStatus.PENDING_DELETE) {
      throw new ConflictException(ERROR_MESSAGES.VIDEO_NOT_PENDING_DELETE);
    }

    this.props.deletionStatus = VideoDeletionStatus.READY_FOR_HARD_DELETE;
    this.props.refundCompletedAt = input.completedAt;
    this.props.refundSummary = input.summary;
    this.touch();
  }

  markStorageDeleted(deletedAt: Date = new Date()): void {
    if (this.deletionStatus === VideoDeletionStatus.STORAGE_DELETED) {
      return;
    }

    if (this.deletionStatus !== VideoDeletionStatus.READY_FOR_HARD_DELETE) {
      throw new ConflictException(
        ERROR_MESSAGES.VIDEO_NOT_READY_FOR_STORAGE_DELETE,
      );
    }

    this.props.deletionStatus = VideoDeletionStatus.STORAGE_DELETED;
    this.props.storageDeletedAt = deletedAt;
    this.touch();
  }

  ban(reason: string): void {
    this.changeStatus(VideoStatus.BANNED);
    this.props.errorMessage = reason;
    this.props.deleteReason = reason;
  }

  incrementViewCount(): void {
    this.props.viewCount += 1;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private setRequestedResolutions(resolutions: string[]): void {
    this.props.resolutions = normalizeVideoResolutions(resolutions);
    this.touch();
  }

  private normalizeProcessingWarnings(warnings: string[]): string[] {
    return normalizeVideoProcessingWarnings(warnings);
  }

  private changeStatus(status: VideoStatus): void {
    const now = new Date();
    this.props.status = status;
    this.props.statusChangedAt = now;
    this.props.updatedAt = now;
  }

}
