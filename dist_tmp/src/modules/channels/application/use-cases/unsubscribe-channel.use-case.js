"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnsubscribeChannelUseCase = void 0;
const base_use_case_1 = require("@shared/application/use-cases/base.use-case");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
class UnsubscribeChannelUseCase extends base_use_case_1.BaseUseCase {
    subscriptionRepository;
    constructor(subscriptionRepository) {
        super();
        this.subscriptionRepository = subscriptionRepository;
    }
    async execute(command) {
        const subscription = await this.subscriptionRepository.findByUserIdAndChannelId(command.userId, command.channelId);
        if (!subscription) {
            throw new domain_exception_1.NotFoundException('Subscription not found');
        }
        if (!subscription.isActive()) {
            throw new domain_exception_1.BadRequestException('Already unsubscribed from this channel');
        }
        subscription.cancel();
        await this.subscriptionRepository.update(subscription);
        return {
            id: subscription.id,
            userId: subscription.userId,
            channelId: subscription.channelId,
            membershipId: subscription.membershipId,
            expiryDate: subscription.expiryDate,
            retryCount: subscription.retryCount,
            status: subscription.status,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
        };
    }
}
exports.UnsubscribeChannelUseCase = UnsubscribeChannelUseCase;
//# sourceMappingURL=unsubscribe-channel.use-case.js.map