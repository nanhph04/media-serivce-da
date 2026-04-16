import type { Response } from 'express';
import { StreamingApplicationService } from '../../application/streaming.application.service';
export declare class StreamingController {
    private readonly streamingApplicationService;
    constructor(streamingApplicationService: StreamingApplicationService);
    getMasterPlaylist(videoId: string, token: string, response: Response): Promise<void>;
    getSegment(videoId: string, segmentName: string, token: string, response: Response): Promise<void>;
}
