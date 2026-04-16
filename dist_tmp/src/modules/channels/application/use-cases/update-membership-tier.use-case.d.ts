import { IMembershipTierRepository } from '../../domain/repositories/membership-tier.repository';
import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { UpdateMembershipTierCommand } from '../dtos/update-membership-tier.command';
import { MembershipTierResponse } from '../dtos/membership-tier.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { ConfigService } from '@shared/infrastructure/config/config.service';
export declare class UpdateMembershipTierUseCase extends BaseUseCase<UpdateMembershipTierCommand, MembershipTierResponse> {
    private readonly membershipTierRepository;
    private readonly channelRepository;
    private readonly configService;
    constructor(membershipTierRepository: IMembershipTierRepository, channelRepository: IChannelRepository, configService: ConfigService);
    execute(command: UpdateMembershipTierCommand): Promise<MembershipTierResponse>;
}
