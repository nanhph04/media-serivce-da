export interface VideoPurchaseUnlockProps {
    id: string;
    videoId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class VideoPurchaseUnlockEntity {
    private readonly props;
    constructor(props: VideoPurchaseUnlockProps);
    get id(): string;
    get videoId(): string;
    get userId(): string;
    get createdAt(): Date;
    get updatedAt(): Date;
    static create(input: {
        videoId: string;
        userId: string;
    }): VideoPurchaseUnlockEntity;
}
