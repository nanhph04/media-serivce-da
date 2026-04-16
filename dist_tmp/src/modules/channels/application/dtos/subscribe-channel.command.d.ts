export interface SubscribeChannelCommand {
    userId: string;
    channelId: string;
    membershipId: string;
}
export interface UnsubscribeChannelCommand {
    userId: string;
    channelId: string;
}
