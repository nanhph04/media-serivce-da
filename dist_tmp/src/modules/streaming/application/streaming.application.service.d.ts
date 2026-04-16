import { PlaybackTokenService } from '@shared/infrastructure/security/playback-token.service';
import { MinioService } from '@shared/infrastructure/storage/minio.service';
import type { Response } from 'express';
import { VideoRepository } from '../../videos/infrastructure/persistence/video.repository';
export declare class StreamingApplicationService {
    private readonly playbackTokenService;
    private readonly minioService;
    private readonly videoRepository;
    constructor(playbackTokenService: PlaybackTokenService, minioService: MinioService, videoRepository: VideoRepository);
    streamMasterPlaylist(videoId: string, token: string): Promise<string>;
    pipeSegment(input: {
        videoId: string;
        token: string;
        segmentName: string;
    }, response: Response): Promise<void>;
    private rewritePlaylist;
    private getPlaylistDirectory;
}
