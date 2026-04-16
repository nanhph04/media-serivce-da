import { VideoApplicationService } from '../../application/video.application.service';
import { ConfirmVideoUploadRequestDto, InitVideoUploadRequestDto, VideoResponseDto } from '../dtos/video.dto';
export declare class VideosController {
    private readonly videoApplicationService;
    constructor(videoApplicationService: VideoApplicationService);
    initUpload(userId: string, dto: InitVideoUploadRequestDto): Promise<{
        videoId: string;
        status: string;
        rawFileKey: string;
        bucket: string;
        uploadUrl: string;
    }>;
    confirmUpload(userId: string, videoId: string, dto: ConfirmVideoUploadRequestDto): Promise<{
        status: string;
        message: string;
    }>;
    playVideo(userId: string, videoId: string): Promise<{
        videoId: string;
        title: string;
        description: string;
        playbackToken: string;
        playbackUrl: string;
    }>;
    latest(limit?: string): Promise<VideoResponseDto[]>;
    byCategory(category: string, limit?: string): Promise<VideoResponseDto[]>;
    subscribed(userId: string, limit?: string): Promise<VideoResponseDto[]>;
    private toDto;
}
