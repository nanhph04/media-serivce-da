import { MembershipTierResponseDto } from './membership-tier.response';
declare class PublicVideoDto {
    id: string;
    title: string;
    category: string;
    status: string;
    thumbnailUrl: string | null;
    publishedAt: string | null;
}
export declare class ChannelDetailResponseDto {
    id: string;
    userId: string;
    name: string;
    bio: string;
    avatarUrl: string;
    bannerUrl: string;
    status: string;
    membershipTiers: MembershipTierResponseDto[];
    publicVideos: PublicVideoDto[];
}
export declare class ChannelSubscriptionStatusResponseDto {
    isActive: boolean;
    membershipId: string | null;
    expiryDate: string | null;
}
export {};
