"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminLockChannelUseCase = void 0;
const base_use_case_1 = require("@shared/application/use-cases/base.use-case");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
class AdminLockChannelUseCase extends base_use_case_1.BaseUseCase {
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
        if (command.action === 'lock') {
            channel.suspend();
        }
        else if (command.action === 'unlock') {
            channel.restore();
        }
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
exports.AdminLockChannelUseCase = AdminLockChannelUseCase;
//# sourceMappingURL=admin-lock-channel.use-case.js.map