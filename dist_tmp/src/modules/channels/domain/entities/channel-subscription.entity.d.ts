export declare enum SubscriptionStatus {
    ACTIVE = "active",
    CANCELLED = "cancelled"
}
export interface ChannelSubscriptionProps {
    id: string;
    userId: string;
    channelId: string;
    membershipId: string;
    expiryDate: Date | null;
    retryCount: number;
    status: SubscriptionStatus;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ChannelSubscriptionEntity {
    private props;
    constructor(props: ChannelSubscriptionProps);
    get id(): string;
    get userId(): string;
    get channelId(): string;
    get membershipId(): string;
    get expiryDate(): Date | null;
    get retryCount(): number;
    get status(): SubscriptionStatus;
    get createdAt(): Date;
    get updatedAt(): Date;
    static create(input: {
        userId: string;
        channelId: string;
        membershipId: string;
        expiryDate: Date | null;
    }): ChannelSubscriptionEntity;
    cancel(): void;
    reactivate(): void;
    isActive(): boolean;
    syncMembership(input: {
        membershipId: string;
        expiryDate: Date | null;
    }): void;
    isCurrentlyActive(): boolean;
}
