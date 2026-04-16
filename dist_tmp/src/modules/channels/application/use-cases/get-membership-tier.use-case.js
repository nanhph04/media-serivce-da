"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMembershipTierUseCase = void 0;
const base_use_case_1 = require("@shared/application/use-cases/base.use-case");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
class GetMembershipTierUseCase extends base_use_case_1.BaseUseCase {
    membershipTierRepository;
    constructor(membershipTierRepository) {
        super();
        this.membershipTierRepository = membershipTierRepository;
    }
    async execute(command) {
        const tier = await this.membershipTierRepository.findById(command.tierId);
        if (!tier) {
            throw new domain_exception_1.NotFoundException('Membership tier not found');
        }
        if (tier.channelId !== command.channelId) {
            throw new domain_exception_1.NotFoundException('Membership tier not found');
        }
        return {
            id: tier.id,
            channelId: tier.channelId,
            name: tier.name,
            level: tier.level,
            priceCoin: tier.priceCoin,
            isAcceptingNew: tier.isAcceptingNew,
            createdAt: tier.createdAt,
            updatedAt: tier.updatedAt,
        };
    }
}
exports.GetMembershipTierUseCase = GetMembershipTierUseCase;
//# sourceMappingURL=get-membership-tier.use-case.js.map