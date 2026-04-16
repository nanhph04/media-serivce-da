import { OnModuleInit } from '@nestjs/common';
import { ChannelApplicationService } from '../../application/channel.application.service';
export declare class MembershipPaymentConsumer implements OnModuleInit {
    private readonly channelApplicationService;
    constructor(channelApplicationService: ChannelApplicationService);
    onModuleInit(): Promise<void>;
}
