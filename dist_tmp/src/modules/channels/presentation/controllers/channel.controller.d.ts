import { ChannelApplicationService } from '../../application/channel.application.service';
import type { CreateChannelRequestDto } from '../dtos/create-channel.request';
import type { UpdateChannelRequestDto } from '../dtos/update-channel.request';
import type { ChannelResponseDto } from '../dtos/channel.response';
import type { ChannelDetailResponseDto, ChannelSubscriptionStatusResponseDto } from '../dtos/channel-detail.response';
export declare class ChannelController {
    private readonly channelApplicationService;
    constructor(channelApplicationService: ChannelApplicationService);
    createChannel(userId: string, dto: CreateChannelRequestDto): Promise<ChannelResponseDto>;
    updateChannel(userId: string, channelId: string, dto: UpdateChannelRequestDto): Promise<ChannelResponseDto>;
    getChannelDetail(channelId: string): Promise<ChannelDetailResponseDto>;
    getSubscriptionStatus(userId: string, channelId: string): Promise<ChannelSubscriptionStatusResponseDto>;
    private mapToResponseDto;
}
