export interface HandleVideoPaymentSuccessCommand {
  eventId: string;
  data: {
    userId: string;
    videoId: string;
    channelId: string;
    channelOwnerId: string;
    coinAmount: number;
    paymentTransactionId: string;
  };
}
