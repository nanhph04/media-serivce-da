export interface ChannelMembershipEligibilityResponse {
  isEligible: boolean;
  readyVideoCount: number;
  minReadyVideoCount: number;
  totalVideoViews: number;
  minTotalVideoViews: number;
  missingRequirements: string[];
}
