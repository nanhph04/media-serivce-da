export interface UpdateMembershipTierCommand {
    channelId: string;
    tierId: string;
    userId: string;
    name?: string;
    priceCoin?: number;
    isAcceptingNew?: boolean;
}
