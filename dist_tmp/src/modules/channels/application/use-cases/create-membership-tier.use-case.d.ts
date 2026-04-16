import { IMembershipTierRepository } from '../../domain/repositories/membership-tier.repository';
import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { CreateMembershipTierCommand } from '../dtos/create-membership-tier.command';
import { MembershipTierResponse } from '../dtos/membership-tier.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { ConfigService } from '@shared/infrastructure/config/config.service';
export declare class CreateMembershipTierUseCase extends BaseUseCase<CreateMembershipTierCommand, MembershipTierResponse> {
    private readonly membershipTierRepository;
    private readonly channelRepository;
    private readonly configService;
    constructor(membershipTierRepository: IMembershipTierRepository, channelRepository: IChannelRepository, configService: ConfigService);
    execute(command: CreateMembershipTierCommand): Promise<MembershipTierResponse>;
}
