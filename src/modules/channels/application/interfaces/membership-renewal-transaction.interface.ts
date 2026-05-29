import type { ChannelMembershipEntity } from '../../domain/entities/channel-membership.entity';

export const MEMBERSHIP_RENEWAL_TRANSACTION = Symbol(
  'MEMBERSHIP_RENEWAL_TRANSACTION',
);

export interface MembershipRenewalOutboxMessage {
  topic: string;
  messageKey: string;
  payload: unknown;
}

export interface IMembershipRenewalTransaction {
  persistRenewalRequest(
    membership: ChannelMembershipEntity,
    outboxMessage: MembershipRenewalOutboxMessage,
  ): Promise<void>;
}
