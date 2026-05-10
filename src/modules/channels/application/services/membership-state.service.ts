import type { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';
import {
  MEMBERSHIP_BLOCKED_REASON,
  type MembershipBlockedReason,
} from '../interfaces/membership-coin-compensation.publisher.interface';

export interface MembershipState {
  isActive: boolean;
  canRenew: boolean;
  canUpgrade: boolean;
  membershipBlockedReason: MembershipBlockedReason | null;
}

export function resolveMembershipState(input: {
  membership: Pick<ChannelMembershipEntity, 'isCurrentlyActive'> | null;
  isMembershipClosedByAdmin: boolean;
}): MembershipState {
  const isActive = input.membership?.isCurrentlyActive() ?? false;
  const membershipBlockedReason = input.isMembershipClosedByAdmin
    ? MEMBERSHIP_BLOCKED_REASON.ADMIN_CLOSED
    : null;

  return {
    isActive,
    canRenew: !input.isMembershipClosedByAdmin && isActive,
    canUpgrade: !input.isMembershipClosedByAdmin && isActive,
    membershipBlockedReason,
  };
}
