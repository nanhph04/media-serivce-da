export const MEMBERSHIP_CONFIG = Symbol('MEMBERSHIP_CONFIG');

export interface IMembershipConfig {
  getMinPriceForLevel(level: number): number;
}
