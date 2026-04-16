import {
  BadRequestException,
  ConflictException,
} from '@shared/domain/exceptions/domain.exception';

export enum VideoStatus {
  DRAFT = 'draft',
  PROCESSING = 'processing',
  PUBLIC = 'public',
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
  category: string;
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

  get category(): string {
    return this.props.category;
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

  static create(input: {
    channelId: string;
    ownerId: string;
    title: string;
    description: string;
    category: string;
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
    });
  }

  markProcessing(): void {
    if (this.props.status !== VideoStatus.DRAFT) {
      throw new ConflictException('Video is not in draft status');
    }
    this.props.status = VideoStatus.PROCESSING;
    this.touch();
  }

  markPublic(input: {
    masterPlaylistKey: string;
    thumbnailUrl?: string | null;
    durationSeconds?: number | null;
    resolutions?: string[];
  }): void {
    this.props.status = VideoStatus.PUBLIC;
    this.props.masterPlaylistKey = input.masterPlaylistKey;
    this.props.thumbnailUrl = input.thumbnailUrl ?? this.props.thumbnailUrl;
    this.props.durationSeconds =
      input.durationSeconds ?? this.props.durationSeconds;
    this.props.resolutions = input.resolutions ?? this.props.resolutions;
    this.props.errorMessage = null;
    this.props.publishedAt = new Date();
    this.touch();
  }

  markFailed(errorMessage: string): void {
    this.props.status = VideoStatus.FAILED;
    this.props.errorMessage = errorMessage;
    this.touch();
  }

  incrementViewCount(): void {
    this.props.viewCount += 1;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private static validate(
    title: string,
    price: number,
    requiredTierLevel: number | null,
  ): void {
    if (!title || title.length > 200) {
      throw new BadRequestException(
        'Video title is required and must be <= 200 characters',
      );
    }
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
}
