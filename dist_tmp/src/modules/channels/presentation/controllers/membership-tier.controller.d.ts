import { ChannelApplicationService } from '../../application/channel.application.service';
import type { CreateMembershipTierRequestDto, UpdateMembershipTierRequestDto, MembershipTierResponseDto } from '../dtos';
export declare class MembershipTierController {
    private readonly channelApplicationService;
    constructor(channelApplicationService: ChannelApplicationService);
    getMembershipTiers(channelId: string): Promise<MembershipTierResponseDto[]>;
    getMembershipTier(channelId: string, tierId: string): Promise<MembershipTierResponseDto>;
    createMembershipTier(userId: string, channelId: string, dto: CreateMembershipTierRequestDto): Promise<MembershipTierResponseDto>;
    updateMembershipTier(userId: string, channelId: string, tierId: string, dto: UpdateMembershipTierRequestDto): Promise<MembershipTierResponseDto>;
    deleteMembershipTier(userId: string, channelId: string, tierId: string): Promise<MembershipTierResponseDto>;
    private mapToResponseDto;
}
