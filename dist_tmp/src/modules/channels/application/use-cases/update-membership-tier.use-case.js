"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMembershipTierUseCase = void 0;
const base_use_case_1 = require("@shared/application/use-cases/base.use-case");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
class UpdateMembershipTierUseCase extends base_use_case_1.BaseUseCase {
    membershipTierRepository;
    channelRepository;
    configService;
    constructor(membershipTierRepository, channelRepository, configService) {
        super();
        this.membershipTierRepository = membershipTierRepository;
        this.channelRepository = channelRepository;
        this.configService = configService;
    }
    async execute(command) {
        const channel = await this.channelRepository.findById(command.channelId);
        if (!channel) {
            throw new domain_exception_1.NotFoundException('Channel not found');
        }
        if (channel.userId !== command.userId) {
            throw new domain_exception_1.ForbiddenException('You do not own this channel');
        }
        const tier = await this.membershipTierRepository.findById(command.tierId);
        if (!tier) {
            throw new domain_exception_1.NotFoundException('Membership tier not found');
        }
        if (tier.channelId !== command.channelId) {
            throw new domain_exception_1.NotFoundException('Membership tier not found');
        }
        if (command.priceCoin !== undefined) {
            const minPrice = this.configService.getMinPriceForLevel(tier.level);
            if (command.priceCoin < minPrice) {
                throw new domain_exception_1.BadRequestException(`Price must be at least ${minPrice} coin for level ${tier.level}`);
            }
        }
        if (command.isAcceptingNew !== undefined) {
            if (command.isAcceptingNew) {
                tier.show();
            }
            else {
                tier.hide();
            }
        }
        tier.update({
            name: command.name,
            priceCoin: command.priceCoin,
            isAcceptingNew: command.isAcceptingNew,
        });
        await this.membershipTierRepository.update(tier);
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
exports.UpdateMembershipTierUseCase = UpdateMembershipTierUseCase;
//# sourceMappingURL=update-membership-tier.use-case.js.map