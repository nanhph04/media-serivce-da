export interface UpdateMembershipAutoRenewCommand {
  userId: string;
  membershipId: string;
  enabled: boolean;
}
