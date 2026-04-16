import { MembershipTierEntity } from '../entities/membership-tier.entity';

export const MEMBERSHIP_TIER_REPOSITORY = Symbol('MEMBERSHIP_TIER_REPOSITORY');

export interface IMembershipTierRepository {
  create(tier: MembershipTierEntity): Promise<void>;
  update(tier: MembershipTierEntity): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<MembershipTierEntity | null>;
  findByChannelId(channelId: string): Promise<MembershipTierEntity[]>;
}
