"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMembershipTiersUseCase = void 0;
const base_use_case_1 = require("@shared/application/use-cases/base.use-case");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
class GetMembershipTiersUseCase extends base_use_case_1.BaseUseCase {
    membershipTierRepository;
    channelRepository;
    constructor(membershipTierRepository, channelRepository) {
        super();
        this.membershipTierRepository = membershipTierRepository;
        this.channelRepository = channelRepository;
    }
    async execute(command) {
        const channel = await this.channelRepository.findById(command.channelId);
        if (!channel) {
            throw new domain_exception_1.NotFoundException('Channel not found');
        }
        const tiers = await this.membershipTierRepository.findByChannelId(command.channelId);
        return tiers.map((tier) => ({
            id: tier.id,
            channelId: tier.channelId,
            name: tier.name,
            level: tier.level,
            priceCoin: tier.priceCoin,
            isAcceptingNew: tier.isAcceptingNew,
            createdAt: tier.createdAt,
            updatedAt: tier.updatedAt,
        }));
    }
}
exports.GetMembershipTiersUseCase = GetMembershipTiersUseCase;
//# sourceMappingURL=get-membership-tiers.use-case.js.map