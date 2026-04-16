export interface MembershipTierResponse {
    id: string;
    channelId: string;
    name: string;
    level: number;
    priceCoin: number;
    isAcceptingNew: boolean;
    createdAt: Date;
    updatedAt: Date;
}
