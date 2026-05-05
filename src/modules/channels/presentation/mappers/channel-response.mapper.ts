import type { ChannelDetailResponseDto } from '../dtos/channel-detail.response';
import type {
  ChannelMembershipEligibilityDto,
  ChannelMembershipStatusResponseDto,
  PublicVideoDto,
} from '../dtos/channel-detail.response';
import type { ChannelResponseDto } from '../dtos/channel.response';
import type { MembershipTierResponseDto } from '../dtos/membership-tier.response';

interface ChannelResponseSource {
  id: string;
  userId: string;
  name: string;
  bio: string;
  isEligibleForMembership: boolean;
  avatarUrl: string;
  bannerUrl: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MembershipTierResponseSource {
  id: string;
  channelId: string;
  name: string;
  level: number;
  priceCoin: number;
  isAcceptingNew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PublicVideoResponseSource {
  id: string;
  title: string;
  categories: string[];
  status: string;
  thumbnailUrl: string | null;
  publishedAt: Date | null;
}

interface ChannelDetailResponseSource {
  channel: ChannelResponseSource;
  membershipEligibility: ChannelMembershipEligibilityDto;
  membershipTiers: MembershipTierResponseSource[];
  publicVideos: PublicVideoResponseSource[];
}

interface ChannelMembershipStatusResponseSource {
  isActive: boolean;
  membershipId: string | null;
  expiryDate: Date | null;
}

export function toChannelResponseDto(
  source: ChannelResponseSource,
): ChannelResponseDto {
  return {
    id: source.id,
    userId: source.userId,
    name: source.name,
    bio: source.bio,
    isEligibleForMembership: source.isEligibleForMembership,
    avatarUrl: source.avatarUrl,
    bannerUrl: source.bannerUrl,
    status: source.status,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

export function toMembershipTierResponseDto(
  source: MembershipTierResponseSource,
): MembershipTierResponseDto {
  return {
    id: source.id,
    channelId: source.channelId,
    name: source.name,
    level: source.level,
    priceCoin: source.priceCoin,
    isAcceptingNew: source.isAcceptingNew,
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
  };
}

export function toPublicVideoResponseDto(
  source: PublicVideoResponseSource,
): PublicVideoDto {
  return {
    id: source.id,
    title: source.title,
    categories: source.categories,
    status: source.status,
    thumbnailUrl: source.thumbnailUrl,
    publishedAt: source.publishedAt?.toISOString() ?? null,
  };
}

export function toChannelDetailResponseDto(
  source: ChannelDetailResponseSource,
): ChannelDetailResponseDto {
  return {
    id: source.channel.id,
    userId: source.channel.userId,
    name: source.channel.name,
    bio: source.channel.bio,
    isEligibleForMembership: source.channel.isEligibleForMembership,
    avatarUrl: source.channel.avatarUrl,
    bannerUrl: source.channel.bannerUrl,
    status: source.channel.status,
    membershipEligibility: source.membershipEligibility,
    membershipTiers: source.membershipTiers.map(toMembershipTierResponseDto),
    publicVideos: source.publicVideos.map(toPublicVideoResponseDto),
  };
}

export function toChannelMembershipStatusResponseDto(
  source: ChannelMembershipStatusResponseSource,
): ChannelMembershipStatusResponseDto {
  return {
    isActive: source.isActive,
    membershipId: source.membershipId,
    expiryDate: source.expiryDate?.toISOString() ?? null,
  };
}
