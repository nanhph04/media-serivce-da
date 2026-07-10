import type {
  VideoProcessingJobPayload,
} from '@shared/application/interfaces/video-processing-job-dispatcher.interface';
import type { VideoEntity } from '../../domain/entities/video.entity';
import { VideoStatus } from '../../domain/entities/video.types';

export const VIDEO_PROCESSING_DISPATCH_TRANSACTION = Symbol(
  'VIDEO_PROCESSING_DISPATCH_TRANSACTION',
);

export interface VideoProcessingDispatchMessage {
  jobId: string;
  payload: VideoProcessingJobPayload;
}

export interface IVideoProcessingDispatchTransaction {
  saveVideoWithProcessingDispatch(
    video: VideoEntity,
    dispatch: VideoProcessingDispatchMessage,
  ): Promise<void>;
  saveVideoWithProcessingDispatchIfStatus(
    video: VideoEntity,
    dispatch: VideoProcessingDispatchMessage,
    expectedStatus: VideoStatus,
  ): Promise<boolean>;
}
