export interface ChannelSubscriptionResponse {
    id: string;
    userId: string;
    channelId: string;
    membershipId: string;
    expiryDate: Date | null;
    retryCount: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}
