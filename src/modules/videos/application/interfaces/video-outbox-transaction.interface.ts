import type { VideoEntity } from '../../domain/entities/video.entity';

export const VIDEO_OUTBOX_TRANSACTION = Symbol('VIDEO_OUTBOX_TRANSACTION');

export interface VideoOutboxMessage {
  topic: string;
  messageKey: string;
  payload: unknown;
}

export interface IVideoOutboxTransaction {
  saveVideoWithOutbox(
    video: VideoEntity,
    outboxMessage: VideoOutboxMessage,
  ): Promise<void>;
}
