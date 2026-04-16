"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelApplicationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const kafka_constants_1 = require("@shared/infrastructure/messaging/kafka.constants");
const kafka_service_1 = require("@shared/infrastructure/messaging/kafka.service");
const cache_service_1 = require("@shared/infrastructure/cache/cache.service");
const config_service_1 = require("@shared/infrastructure/config/config.service");
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
const channel_entity_1 = require("../domain/entities/channel.entity");
const channel_subscription_entity_1 = require("../domain/entities/channel-subscription.entity");
const membership_tier_entity_1 = require("../domain/entities/membership-tier.entity");
const channel_repository_impl_1 = require("../infrastructure/persistence/channel.repository.impl");
const channel_subscription_repository_impl_1 = require("../infrastructure/persistence/channel-subscription.repository.impl");
const membership_tier_repository_impl_1 = require("../infrastructure/persistence/membership-tier.repository.impl");
const video_orm_entity_1 = require("../../videos/infrastructure/persistence/video.orm-entity");
const video_entity_1 = require("../../videos/domain/entities/video.entity");
let ChannelApplicationService = class ChannelApplicationService {
    channelRepository;
    membershipTierRepository;
    subscriptionRepository;
    configService;
    cacheService;
    kafkaService;
    videoRepository;
    constructor(channelRepository, membershipTierRepository, subscriptionRepository, configService, cacheService, kafkaService, videoRepository) {
        this.channelRepository = channelRepository;
        this.membershipTierRepository = membershipTierRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.configService = configService;
        this.cacheService = cacheService;
        this.kafkaService = kafkaService;
        this.videoRepository = videoRepository;
    }
    async createChannel(input) {
        const existing = await this.channelRepository.findByUserId(input.userId);
        if (existing) {
            throw new domain_exception_1.BadRequestException('Channel already exists');
        }
        const channel = channel_entity_1.ChannelEntity.create(input);
        await this.channelRepository.create(channel);
        return channel;
    }
    async updateChannel(input) {
        const channel = await this.requireOwnedChannel(input.channelId, input.userId);
        channel.update({
            name: input.name,
            bio: input.bio,
            avatarUrl: input.avatarUrl,
            bannerUrl: input.bannerUrl,
        });
        await this.channelRepository.update(channel);
        return channel;
    }
    async getChannelDetail(channelId) {
        const channel = await this.channelRepository.findById(channelId);
        if (!channel) {
            throw new domain_exception_1.NotFoundException('Channel not found');
        }
        const membershipTiers = (await this.membershipTierRepository.findByChannelId(channelId)).filter((tier) => tier.isAcceptingNew);
        const publicVideos = await this.videoRepository.find({
            where: {
                channelId,
                status: video_entity_1.VideoStatus.PUBLIC,
                visibility: video_entity_1.VideoVisibility.PUBLIC,
            },
            order: { publishedAt: 'DESC', createdAt: 'DESC' },
        });
        return { channel, membershipTiers, publicVideos };
    }
    async createTier(input) {
        await this.requireOwnedChannel(input.channelId, input.userId);
        const existingTiers = await this.membershipTierRepository.findByChannelId(input.channelId);
        const duplicate = existingTiers.find((tier) => tier.level === input.level);
        if (duplicate) {
            throw new domain_exception_1.ConflictException('Membership tier level already exists');
        }
        const minPrice = this.configService.getMinPriceForLevel(input.level);
        if (input.priceCoin < minPrice) {
            throw new domain_exception_1.BadRequestException(`Price must be at least ${minPrice} coin for level ${input.level}`);
        }
        const tier = membership_tier_entity_1.MembershipTierEntity.create(input);
        await this.membershipTierRepository.create(tier);
        return tier;
    }
    async getTiers(channelId) {
        return this.membershipTierRepository.findByChannelId(channelId);
    }
    async getTier(channelId, tierId) {
        const tier = await this.membershipTierRepository.findById(tierId);
        if (!tier || tier.channelId !== channelId) {
            throw new domain_exception_1.NotFoundException('Membership tier not found');
        }
        return tier;
    }
    async updateTier(input) {
        await this.requireOwnedChannel(input.channelId, input.userId);
        const tier = await this.getTier(input.channelId, input.tierId);
        if (input.priceCoin !== undefined) {
            const minPrice = this.configService.getMinPriceForLevel(tier.level);
            if (input.priceCoin < minPrice) {
                throw new domain_exception_1.BadRequestException(`Price must be at least ${minPrice} coin for level ${tier.level}`);
            }
        }
        tier.update({
            name: input.name,
            priceCoin: input.priceCoin,
            isAcceptingNew: input.isAcceptingNew,
        });
        await this.membershipTierRepository.update(tier);
        return tier;
    }
    async disableTier(input) {
        await this.requireOwnedChannel(input.channelId, input.userId);
        const tier = await this.getTier(input.channelId, input.tierId);
        tier.hide();
        await this.membershipTierRepository.update(tier);
        return tier;
    }
    async getSubscriptionStatus(input) {
        const subscription = await this.subscriptionRepository.findByUserIdAndChannelIdActive(input.userId, input.channelId);
        return {
            isActive: subscription?.isCurrentlyActive() ?? false,
            membershipId: subscription?.membershipId ?? null,
            expiryDate: subscription?.expiryDate ?? null,
        };
    }
    async handleFinanceEvents() {
        await this.kafkaService.on(this.configService.get('KAFKA_MEMBERSHIP_PAYMENT_SUCCESS_TOPIC', 'membership.payment.success'), async ({ value }) => {
            if (!(await this.cacheService.setIfNotExists(`media:event:${value.eventId}`, '1', 60 * 60 * 24))) {
                return;
            }
            const existing = await this.subscriptionRepository.findByUserIdAndChannelId(value.data.userId, value.data.channelId);
            if (existing) {
                existing.syncMembership({
                    membershipId: value.data.membershipTierId,
                    expiryDate: value.data.expiryDate
                        ? new Date(value.data.expiryDate)
                        : null,
                });
                await this.subscriptionRepository.upsert(existing);
                return;
            }
            const subscription = channel_subscription_entity_1.ChannelSubscriptionEntity.create({
                userId: value.data.userId,
                channelId: value.data.channelId,
                membershipId: value.data.membershipTierId,
                expiryDate: value.data.expiryDate
                    ? new Date(value.data.expiryDate)
                    : null,
            });
            await this.subscriptionRepository.upsert(subscription);
        });
    }
    async requireOwnedChannel(channelId, userId) {
        const channel = await this.channelRepository.findById(channelId);
        if (!channel) {
            throw new domain_exception_1.NotFoundException('Channel not found');
        }
        if (channel.userId !== userId) {
            throw new domain_exception_1.ForbiddenException('You do not own this channel');
        }
        if (channel.status !== channel_entity_1.ChannelStatus.ACTIVE) {
            throw new domain_exception_1.ForbiddenException('Channel is not active');
        }
        return channel;
    }
};
exports.ChannelApplicationService = ChannelApplicationService;
exports.ChannelApplicationService = ChannelApplicationService = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, common_1.Inject)(kafka_constants_1.KAFKA_SERVICE)),
    __param(6, (0, typeorm_1.InjectRepository)(video_orm_entity_1.VideoOrmEntity)),
    __metadata("design:paramtypes", [channel_repository_impl_1.ChannelRepositoryImpl,
        membership_tier_repository_impl_1.MembershipTierRepositoryImpl,
        channel_subscription_repository_impl_1.ChannelSubscriptionRepositoryImpl,
        config_service_1.ConfigService,
        cache_service_1.CacheService,
        kafka_service_1.KafkaService, Function])
], ChannelApplicationService);
//# sourceMappingURL=channel.application.service.js.map