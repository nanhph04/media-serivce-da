import { VideoStatus, VideoVisibility } from '../../domain/entities/video.entity';
export declare class VideoOrmEntity {
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
