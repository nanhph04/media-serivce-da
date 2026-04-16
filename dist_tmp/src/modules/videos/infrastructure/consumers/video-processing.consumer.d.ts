import { OnModuleInit } from '@nestjs/common';
import { VideoApplicationService } from '../../application/video.application.service';
export declare class VideoProcessingConsumer implements OnModuleInit {
    private readonly videoApplicationService;
    constructor(videoApplicationService: VideoApplicationService);
    onModuleInit(): Promise<void>;
}
