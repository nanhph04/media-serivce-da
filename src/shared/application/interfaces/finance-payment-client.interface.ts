export const FINANCE_PAYMENT_CLIENT = Symbol('FINANCE_PAYMENT_CLIENT');

export type FinancePaymentServiceType = 'video' | 'membership';

export interface FinancePaymentMetadata {
  videoTitle?: string;
  channelName?: string;
  thumbnailUrl?: string;
  packageName?: string;
}

export interface ChargeFinancePaymentInput {
  payerUserId: string;
  idempotencyKey: string;
  traceId?: string;
  serviceType: FinancePaymentServiceType;
  serviceId: string;
  channelId: string;
  channelOwnerId: string;
  coinAmount: number;
  metadata?: FinancePaymentMetadata;
}

export interface FinancePaymentTransaction {
  id: string;
  type: string;
  status: string;
  amount: number;
  fromWalletId?: string;
  toWalletId?: string;
  referenceId?: string;
}

export interface FinancePaymentResult {
  payerWalletId: string;
  channelWalletId: string;
  systemWalletId: string;
  serviceType: FinancePaymentServiceType;
  serviceId: string;
  channelId: string;
  channelOwnerId: string;
  coinAmount: number;
  splitPercent: number;
  creatorCoins: number;
  systemCoins: number;
  transactions: FinancePaymentTransaction[];
}

export interface IFinancePaymentClient {
  charge(input: ChargeFinancePaymentInput): Promise<FinancePaymentResult>;
}
