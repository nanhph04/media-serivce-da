import { IMembershipTierRepository } from '../../domain/repositories/membership-tier.repository';
import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { MembershipTierResponse } from '../dtos/membership-tier.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
export declare class GetMembershipTiersUseCase extends BaseUseCase<{
    channelId: string;
}, MembershipTierResponse[]> {
    private readonly membershipTierRepository;
    private readonly channelRepository;
    constructor(membershipTierRepository: IMembershipTierRepository, channelRepository: IChannelRepository);
    execute(command: {
        channelId: string;
    }): Promise<MembershipTierResponse[]>;
}
