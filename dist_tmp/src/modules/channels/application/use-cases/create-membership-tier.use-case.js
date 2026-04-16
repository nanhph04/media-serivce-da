"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMembershipTierUseCase = void 0;
const membership_tier_entity_1 = require("../../domain/entities/membership-tier.entity");
const base_use_case_1 = require("@shared/application/use-cases/base.use-case");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
class CreateMembershipTierUseCase extends base_use_case_1.BaseUseCase {
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
        if (![1, 2, 3].includes(command.level)) {
            throw new domain_exception_1.BadRequestException('Level must be 1, 2, or 3');
        }
        const existingTiers = await this.membershipTierRepository.findByChannelId(command.channelId);
        const existingTier = existingTiers.find((tier) => tier.level === command.level);
        if (existingTier) {
            if (existingTier.isAcceptingNew) {
                existingTier.hide();
                await this.membershipTierRepository.update(existingTier);
            }
            else {
                throw new domain_exception_1.ConflictException('Tier is hidden, please update existing tier instead');
            }
        }
        const minPrice = this.configService.getMinPriceForLevel(command.level);
        if (command.priceCoin < minPrice) {
            throw new domain_exception_1.BadRequestException(`Price must be at least ${minPrice} coin for level ${command.level}`);
        }
        const tier = membership_tier_entity_1.MembershipTierEntity.create({
            channelId: command.channelId,
            name: command.name,
            level: command.level,
            priceCoin: command.priceCoin,
        });
        await this.membershipTierRepository.create(tier);
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
exports.CreateMembershipTierUseCase = CreateMembershipTierUseCase;
//# sourceMappingURL=create-membership-tier.use-case.js.map