export interface CreateMembershipTierCommand {
  channelId: string;
  userId: string;
  name: string;
  level: 1 | 2 | 3;
  priceCoin: number;
}
