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
}

export enum VideoVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
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
  viewCount: number;
  publishedAt: Date | null;
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
      viewCount: 0,
      publishedAt: null,
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

  markPendingManualReview(reason: string): void {
    this.changeStatus(VideoStatus.PENDING_MANUAL_REVIEW);
    this.props.errorMessage = reason;
  }

  markRejected(reason: string): void {
    this.changeStatus(VideoStatus.REJECTED);
    this.props.errorMessage = reason;
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
