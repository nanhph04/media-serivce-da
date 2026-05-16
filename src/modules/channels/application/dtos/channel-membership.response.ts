export interface ChannelMembershipResponse {
  id: string;
  userId: string;
  channelId: string;
  membershipId: string;
  expiryDate: Date | null;
  retryCount: number;
  status: string;
  autoRenewEnabled: boolean;
  renewalStatus: string;
  renewalReminderSentAt: Date | null;
  lastRenewalAttemptAt: Date | null;
  nextRenewalAttemptAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
