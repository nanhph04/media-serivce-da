"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChannelUseCase = void 0;
const channel_entity_1 = require("../../domain/entities/channel.entity");
const base_use_case_1 = require("@shared/application/use-cases/base.use-case");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
class CreateChannelUseCase extends base_use_case_1.BaseUseCase {
    channelRepository;
    constructor(channelRepository) {
        super();
        this.channelRepository = channelRepository;
    }
    async execute(command) {
        const existingChannel = await this.channelRepository.findByUserId(command.userId);
        if (existingChannel) {
            throw new domain_exception_1.BadRequestException('Channel already exists');
        }
        const channel = channel_entity_1.ChannelEntity.create(command);
        await this.channelRepository.create(channel);
        return {
            id: channel.id,
            userId: channel.userId,
            name: channel.name,
            bio: channel.bio,
            isEligibleForMembership: channel.isEligibleForMembership,
            avatarUrl: channel.avatarUrl,
            bannerUrl: channel.bannerUrl,
            status: channel.status,
            createdAt: channel.createdAt,
            updatedAt: channel.updatedAt,
        };
    }
}
exports.CreateChannelUseCase = CreateChannelUseCase;
//# sourceMappingURL=create-channel.use-case.js.map