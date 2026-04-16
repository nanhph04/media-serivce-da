import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChannelApplicationService } from '../../application/channel.application.service';

@Injectable()
export class MembershipPaymentConsumer implements OnModuleInit {
  constructor(
    private readonly channelApplicationService: ChannelApplicationService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.channelApplicationService.handleFinanceEvents();
  }
}
