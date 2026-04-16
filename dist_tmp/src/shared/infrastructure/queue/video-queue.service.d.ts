import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
export interface VideoProcessingJobPayload {
    videoId: string;
    rawFileKey: string;
    resolution: string[];
    userId: string;
}
export declare class VideoQueueService implements OnModuleDestroy {
    private readonly configService;
    private readonly queue;
    constructor(configService: ConfigService);
    enqueueTranscodeJob(payload: VideoProcessingJobPayload): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
