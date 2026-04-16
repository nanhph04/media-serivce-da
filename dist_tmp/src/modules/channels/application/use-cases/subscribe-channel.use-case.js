"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscribeChannelUseCase = void 0;
const channel_subscription_entity_1 = require("../../domain/entities/channel-subscription.entity");
const base_use_case_1 = require("@shared/application/use-cases/base.use-case");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
class SubscribeChannelUseCase extends base_use_case_1.BaseUseCase {
    subscriptionRepository;
    channelRepository;
    constructor(subscriptionRepository, channelRepository) {
        super();
        this.subscriptionRepository = subscriptionRepository;
        this.channelRepository = channelRepository;
    }
    async execute(command) {
        const channel = await this.channelRepository.findById(command.channelId);
        if (!channel) {
            throw new domain_exception_1.NotFoundException('Channel not found');
        }
        if (channel.userId === command.userId) {
            throw new domain_exception_1.BadRequestException('Cannot subscribe to your own channel');
        }
        const existingSubscription = await this.subscriptionRepository.findByUserIdAndChannelId(command.userId, command.channelId);
        if (existingSubscription) {
            if (existingSubscription.isActive()) {
                throw new domain_exception_1.BadRequestException('Already subscribed to this channel');
            }
            existingSubscription.reactivate();
            await this.subscriptionRepository.update(existingSubscription);
            return {
                id: existingSubscription.id,
                userId: existingSubscription.userId,
                channelId: existingSubscription.channelId,
                membershipId: existingSubscription.membershipId,
                expiryDate: existingSubscription.expiryDate,
                retryCount: existingSubscription.retryCount,
                status: existingSubscription.status,
                createdAt: existingSubscription.createdAt,
                updatedAt: existingSubscription.updatedAt,
            };
        }
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);
        const subscription = channel_subscription_entity_1.ChannelSubscriptionEntity.create({
            userId: command.userId,
            channelId: command.channelId,
            membershipId: command.membershipId,
            expiryDate: expiryDate,
        });
        await this.subscriptionRepository.create(subscription);
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
exports.SubscribeChannelUseCase = SubscribeChannelUseCase;
//# sourceMappingURL=subscribe-channel.use-case.js.map