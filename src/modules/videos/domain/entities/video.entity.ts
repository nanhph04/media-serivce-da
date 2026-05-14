import {
  BadRequestException,
  ConflictException,
} from '@shared/domain/exceptions/domain.exception';
import { Category } from '../../../categories/domain/entities/category.entity';
import { Tag } from '../../../tags/domain/entities/tag.entity';

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
}

export interface VideoModerationDetails {
  reason: string;
  confidence: number;
  evidenceTimestampSeconds: number | null;
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
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  resolutions: string[];
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
  createdAt: Date;
  updatedAt: Date;
  statusChangedAt?: Date;
}

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

  get durationSeconds(): number | null {
    return this.props.durationSeconds;
  }

  get resolutions(): string[] {
    return this.props.resolutions;
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

  get isDeletePending(): boolean {
    return this.deletionStatus === VideoDeletionStatus.PENDING_DELETE;
  }

  get isReadyForHardDelete(): boolean {
    return this.deletionStatus === VideoDeletionStatus.READY_FOR_HARD_DELETE;
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
    VideoEntity.validate(input.title, input.price, input.requiredTierLevel);

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
      thumbnailUrl: null,
      durationSeconds: null,
      resolutions: [],
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
      createdAt: now,
      updatedAt: now,
      statusChangedAt: now,
    });
  }

  markProcessing(): void {
    if (
      this.props.status !== VideoStatus.DRAFT &&
      this.props.status !== VideoStatus.PENDING_MODERATION
    ) {
      throw new ConflictException('Video cannot be marked as processing');
    }
    this.changeStatus(VideoStatus.PROCESSING);
  }

  markPendingModeration(): void {
    this.assertDraftUploadMutable();
    this.changeStatus(VideoStatus.PENDING_MODERATION);
    this.props.errorMessage = null;
  }

  replaceDraftRawFile(rawFileKey: string): void {
    this.assertDraftUploadMutable();
    this.props.rawFileKey = rawFileKey;
    this.props.errorMessage = null;
    this.touch();
  }

  assertDraftUploadMutable(): void {
    if (this.props.status !== VideoStatus.DRAFT) {
      throw new ConflictException('Video is not in draft status');
    }
  }

  get moderationDetails(): VideoModerationDetails | null {
    return this.props.moderationDetails ?? null;
  }

  markPendingManualReview(
    reason: string,
    moderationDetails: VideoModerationDetails | null = null,
  ): void {
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

  markReady(input: {
    masterPlaylistKey: string;
    thumbnailUrl?: string | null;
    durationSeconds?: number | null;
    resolutions?: string[];
  }): void {
    this.changeStatus(VideoStatus.READY);
    this.props.masterPlaylistKey = input.masterPlaylistKey;
    this.props.thumbnailUrl = input.thumbnailUrl ?? this.props.thumbnailUrl;
    this.props.durationSeconds =
      input.durationSeconds ?? this.props.durationSeconds;
    this.props.resolutions = input.resolutions ?? this.props.resolutions;
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
  }): void {
    if (input.title !== undefined) {
      VideoEntity.validateTitle(input.title);
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

    this.touch();
  }

  markFailed(errorMessage: string): void {
    this.changeStatus(VideoStatus.FAILED);
    this.props.errorMessage = errorMessage;
  }

  unpublish(input: { deletedBy: string; reason: string }): void {
    if (this.props.status !== VideoStatus.READY) {
      throw new ConflictException('Only ready videos can be unpublished');
    }
    if (this.deletionStatus !== VideoDeletionStatus.ACTIVE) {
      throw new ConflictException('Video delete has already been requested');
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
      throw new ConflictException('Video is not pending delete');
    }

    this.props.deletionStatus = VideoDeletionStatus.READY_FOR_HARD_DELETE;
    this.props.refundCompletedAt = input.completedAt;
    this.props.refundSummary = input.summary;
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

  private changeStatus(status: VideoStatus): void {
    const now = new Date();
    this.props.status = status;
    this.props.statusChangedAt = now;
    this.props.updatedAt = now;
  }

  private static validate(
    title: string,
    price: number,
    requiredTierLevel: number | null,
  ): void {
    VideoEntity.validateTitle(title);

    if (price < 0) {
      throw new BadRequestException('Video price cannot be negative');
    }
    if (
      requiredTierLevel !== null &&
      (requiredTierLevel < 1 || requiredTierLevel > 3)
    ) {
      throw new BadRequestException(
        'Required tier level must be between 1 and 3',
      );
    }
  }

  private static validateTitle(title: string): void {
    if (!title || title.length > 200) {
      throw new BadRequestException(
        'Video title is required and must be <= 200 characters',
      );
    }
  }
}
