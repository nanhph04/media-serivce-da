import { IMembershipTierRepository } from '../../domain/repositories/membership-tier.repository';
import { MembershipTierResponse } from '../dtos/membership-tier.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
export declare class GetMembershipTierUseCase extends BaseUseCase<{
    channelId: string;
    tierId: string;
}, MembershipTierResponse> {
    private readonly membershipTierRepository;
    constructor(membershipTierRepository: IMembershipTierRepository);
    execute(command: {
        channelId: string;
        tierId: string;
    }): Promise<MembershipTierResponse>;
}
