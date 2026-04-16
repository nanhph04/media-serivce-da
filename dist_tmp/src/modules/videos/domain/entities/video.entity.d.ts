export declare enum VideoStatus {
    DRAFT = "draft",
    PROCESSING = "processing",
    PUBLIC = "public",
    FAILED = "failed"
}
export declare enum VideoVisibility {
    PUBLIC = "public",
    PRIVATE = "private"
}
export interface VideoProps {
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
export declare class VideoEntity {
    private readonly props;
    constructor(props: VideoProps);
    get id(): string;
    get channelId(): string;
    get ownerId(): string;
    get title(): string;
    get description(): string;
    get category(): string;
    get visibility(): VideoVisibility;
    get status(): VideoStatus;
    get price(): number;
    get requiredTierLevel(): number | null;
    get rawFileKey(): string;
    get masterPlaylistKey(): string | null;
    get thumbnailUrl(): string | null;
    get durationSeconds(): number | null;
    get resolutions(): string[];
    get errorMessage(): string | null;
    get viewCount(): number;
    get publishedAt(): Date | null;
    get createdAt(): Date;
    get updatedAt(): Date;
    static create(input: {
        channelId: string;
        ownerId: string;
        title: string;
        description: string;
        category: string;
        visibility: VideoVisibility;
        price: number;
        requiredTierLevel: number | null;
        rawFileKey: string;
    }): VideoEntity;
    markProcessing(): void;
    markPublic(input: {
        masterPlaylistKey: string;
        thumbnailUrl?: string | null;
        durationSeconds?: number | null;
        resolutions?: string[];
    }): void;
    markFailed(errorMessage: string): void;
    incrementViewCount(): void;
    private touch;
    private static validate;
}
