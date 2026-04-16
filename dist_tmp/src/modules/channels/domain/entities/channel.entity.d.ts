export declare enum ChannelStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    SUSPENDED = "suspended"
}
export interface ChannelProps {
    id: string;
    userId: string;
    name: string;
    bio: string;
    avatarUrl: string;
    bannerUrl: string;
    status: ChannelStatus;
    isEligibleForMembership: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ChannelEntity {
    private props;
    constructor(props: ChannelProps);
    get id(): string;
    get userId(): string;
    get name(): string;
    get bio(): string;
    get avatarUrl(): string;
    get bannerUrl(): string;
    get status(): ChannelStatus;
    get isEligibleForMembership(): boolean;
    get createdAt(): Date;
    get updatedAt(): Date;
    static create(input: {
        userId: string;
        name: string;
        bio: string;
    }): ChannelEntity;
    update(input: Partial<Pick<ChannelProps, 'name' | 'bio' | 'avatarUrl' | 'bannerUrl' | 'status'>>): void;
    delete(): void;
    restore(): void;
    suspend(): void;
}
