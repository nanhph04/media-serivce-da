import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';

export type VideoWatchProgressState = 'watching' | 'paused' | 'completed';

export interface VideoWatchProgressProps {
  id: string;
  userId: string;
  videoId: string;
  channelId: string;
  lastPositionSeconds: number;
  durationSeconds: number | null;
  lastWatchedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class VideoWatchProgressEntity {
  private props: VideoWatchProgressProps;

  constructor(props: VideoWatchProgressProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get videoId(): string {
    return this.props.videoId;
  }

  get channelId(): string {
    return this.props.channelId;
  }

  get lastPositionSeconds(): number {
    return this.props.lastPositionSeconds;
  }

  get durationSeconds(): number | null {
    return this.props.durationSeconds;
  }

  get lastWatchedAt(): Date {
    return this.props.lastWatchedAt;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  static create(input: {
    userId: string;
    videoId: string;
    channelId: string;
    positionSeconds: number;
    durationSeconds?: number | null;
    state?: VideoWatchProgressState;
    completionThresholdSeconds?: number;
  }): VideoWatchProgressEntity {
    const now = new Date();
    const entity = new VideoWatchProgressEntity({
      id: crypto.randomUUID(),
      userId: input.userId,
      videoId: input.videoId,
      channelId: input.channelId,
      lastPositionSeconds: 0,
      durationSeconds: null,
      lastWatchedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    entity.updateProgress({
      positionSeconds: input.positionSeconds,
      durationSeconds: input.durationSeconds,
      state: input.state,
      completionThresholdSeconds: input.completionThresholdSeconds,
    });

    return entity;
  }

  updateProgress(input: {
    positionSeconds: number;
    durationSeconds?: number | null;
    state?: VideoWatchProgressState;
    completionThresholdSeconds?: number;
  }): boolean {
    this.assertNonNegativeSeconds(input.positionSeconds, 'Position');
    if (input.durationSeconds !== undefined && input.durationSeconds !== null) {
      this.assertNonNegativeSeconds(input.durationSeconds, 'Duration');
    }

    const nextState = input.state ?? 'watching';
    if (
      nextState !== 'completed' &&
      input.positionSeconds < this.props.lastPositionSeconds - 5
    ) {
      return false;
    }

    if (input.durationSeconds !== undefined) {
      this.props.durationSeconds = input.durationSeconds;
    }

    this.props.lastPositionSeconds = input.positionSeconds;
    this.props.lastWatchedAt = new Date();
    this.props.updatedAt = this.props.lastWatchedAt;

    const completionThresholdSeconds = input.completionThresholdSeconds ?? 30;
    const effectiveDurationSeconds = this.props.durationSeconds;
    const shouldMarkCompleted =
      nextState === 'completed' ||
      (effectiveDurationSeconds !== null &&
        effectiveDurationSeconds - input.positionSeconds <=
          completionThresholdSeconds);

    this.props.completedAt = shouldMarkCompleted ? new Date() : null;
    return true;
  }

  isCompleted(): boolean {
    return this.props.completedAt !== null;
  }

  private assertNonNegativeSeconds(value: number, fieldName: string): void {
    if (value < 0) {
      throw new BadRequestException(
        `${fieldName} ${ERROR_MESSAGES.SECONDS_CANNOT_BE_NEGATIVE}`,
      );
    }
  }
}
