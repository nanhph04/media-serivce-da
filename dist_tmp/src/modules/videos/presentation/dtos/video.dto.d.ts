export declare class InitVideoUploadRequestDto {
    channelId: string;
    title: string;
    description: string;
    category: string;
    visibility: 'public' | 'private';
    price: number;
    requiredTierLevel?: number | null;
}
export declare class ConfirmVideoUploadRequestDto {
    resolutions: string[];
}
export declare class VideoResponseDto {
    id: string;
    channelId: string;
    title: string;
    description: string;
    category: string;
    status: string;
    price: number;
    requiredTierLevel: number | null;
    thumbnailUrl: string | null;
    durationSeconds: number | null;
    resolutions: string[];
    viewCount: number;
    publishedAt: string | null;
    createdAt: string;
    updatedAt: string;
}
