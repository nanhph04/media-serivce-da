import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';

export enum ContentReportTargetType {
  VIDEO = 'video',
  CHANNEL = 'channel',
}

export enum ContentReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export interface ContentReportProps {
  id: string;
  targetType: ContentReportTargetType;
  reporterUserId: string;
  targetVideoId: string | null;
  targetChannelId: string;
  reason: string;
  evidenceTimestampSeconds: number | null;
  contextVideoId: string | null;
  contextVideoTitle: string | null;
  status: ContentReportStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class ContentReportEntity {
  constructor(private readonly props: ContentReportProps) {}

  get id(): string {
    return this.props.id;
  }

  get targetType(): ContentReportTargetType {
    return this.props.targetType;
  }

  get reporterUserId(): string {
    return this.props.reporterUserId;
  }

  get targetVideoId(): string | null {
    return this.props.targetVideoId;
  }

  get targetChannelId(): string {
    return this.props.targetChannelId;
  }

  get reason(): string {
    return this.props.reason;
  }

  get evidenceTimestampSeconds(): number | null {
    return this.props.evidenceTimestampSeconds;
  }

  get contextVideoId(): string | null {
    return this.props.contextVideoId;
  }

  get contextVideoTitle(): string | null {
    return this.props.contextVideoTitle;
  }

  get status(): ContentReportStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static createVideoReport(input: {
    reporterUserId: string;
    targetVideoId: string;
    targetChannelId: string;
    reason: string;
    evidenceTimestampSeconds?: number | null;
  }): ContentReportEntity {
    const now = new Date();
    return new ContentReportEntity({
      id: randomUUID(),
      targetType: ContentReportTargetType.VIDEO,
      reporterUserId: ContentReportEntity.requireText(
        input.reporterUserId,
        'Reporter user id is required',
      ),
      targetVideoId: ContentReportEntity.requireText(
        input.targetVideoId,
        'Target video id is required',
      ),
      targetChannelId: ContentReportEntity.requireText(
        input.targetChannelId,
        'Target channel id is required',
      ),
      reason: ContentReportEntity.normalizeReason(input.reason),
      evidenceTimestampSeconds: ContentReportEntity.normalizeTimestamp(
        input.evidenceTimestampSeconds,
      ),
      contextVideoId: null,
      contextVideoTitle: null,
      status: ContentReportStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });
  }

  static createChannelReport(input: {
    reporterUserId: string;
    targetChannelId: string;
    reason: string;
    contextVideoId?: string | null;
    contextVideoTitle?: string | null;
  }): ContentReportEntity {
    const now = new Date();
    return new ContentReportEntity({
      id: randomUUID(),
      targetType: ContentReportTargetType.CHANNEL,
      reporterUserId: ContentReportEntity.requireText(
        input.reporterUserId,
        'Reporter user id is required',
      ),
      targetVideoId: null,
      targetChannelId: ContentReportEntity.requireText(
        input.targetChannelId,
        'Target channel id is required',
      ),
      reason: ContentReportEntity.normalizeReason(input.reason),
      evidenceTimestampSeconds: null,
      contextVideoId: ContentReportEntity.normalizeOptionalText(
        input.contextVideoId,
        36,
      ),
      contextVideoTitle: ContentReportEntity.normalizeOptionalText(
        input.contextVideoTitle,
        200,
      ),
      status: ContentReportStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });
  }

  updateStatus(status: ContentReportStatus): void {
    if (status === ContentReportStatus.PENDING) {
      throw new BadRequestException('Cannot move report back to pending');
    }

    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  private static normalizeReason(reason: string): string {
    const normalized = reason.trim();
    if (!normalized) {
      throw new BadRequestException('Report reason is required');
    }

    if (normalized.length > 1000) {
      throw new BadRequestException('Report reason must be <= 1000 characters');
    }

    return normalized;
  }

  private static normalizeTimestamp(value?: number | null): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (!Number.isInteger(value) || value < 0) {
      throw new BadRequestException(
        'Evidence timestamp must be a non-negative integer',
      );
    }

    return value;
  }

  private static requireText(value: string, message: string): string {
    const normalized = value.trim();
    if (!normalized) {
      throw new BadRequestException(message);
    }

    return normalized;
  }

  private static normalizeOptionalText(
    value: string | null | undefined,
    maxLength: number,
  ): string | null {
    const normalized = value?.trim();
    if (!normalized) {
      return null;
    }

    return normalized.length > maxLength
      ? normalized.slice(0, maxLength)
      : normalized;
  }
}
