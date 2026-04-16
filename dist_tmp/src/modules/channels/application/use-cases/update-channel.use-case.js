"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateChannelUseCase = void 0;
const base_use_case_1 = require("@shared/application/use-cases/base.use-case");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
class UpdateChannelUseCase extends base_use_case_1.BaseUseCase {
    channelRepository;
    constructor(channelRepository) {
        super();
        this.channelRepository = channelRepository;
    }
    async execute(command) {
        const channel = await this.channelRepository.findById(command.channelId);
        if (!channel) {
            throw new domain_exception_1.NotFoundException('Channel not found');
        }
        if (channel.userId !== command.userId) {
            throw new domain_exception_1.ForbiddenException('You do not own this channel');
        }
        channel.update({
            name: command.name,
            bio: command.bio,
            avatarUrl: command.avatarUrl,
            bannerUrl: command.bannerUrl,
        });
        await this.channelRepository.update(channel);
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
exports.UpdateChannelUseCase = UpdateChannelUseCase;
//# sourceMappingURL=update-channel.use-case.js.map