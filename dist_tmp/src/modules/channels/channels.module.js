"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const channel_application_service_1 = require("./application/channel.application.service");
const channel_controller_1 = require("./presentation/controllers/channel.controller");
const membership_tier_controller_1 = require("./presentation/controllers/membership-tier.controller");
const channel_repository_impl_1 = require("./infrastructure/persistence/channel.repository.impl");
const channel_orm_entity_1 = require("./infrastructure/persistence/channel.orm-entity");
const channel_subscription_repository_impl_1 = require("./infrastructure/persistence/channel-subscription.repository.impl");
const channel_subscription_orm_entity_1 = require("./infrastructure/persistence/channel-subscription.orm-entity");
const membership_tier_orm_entity_1 = require("./infrastructure/persistence/membership-tier.orm-entity");
const membership_tier_repository_impl_1 = require("./infrastructure/persistence/membership-tier.repository.impl");
const channel_subscription_mapper_1 = require("./infrastructure/mappers/channel-subscription.mapper");
const membership_payment_consumer_1 = require("./infrastructure/consumers/membership-payment.consumer");
const config_module_1 = require("@shared/infrastructure/config/config.module");
const video_orm_entity_1 = require("../videos/infrastructure/persistence/video.orm-entity");
let ChannelsModule = class ChannelsModule {
};
exports.ChannelsModule = ChannelsModule;
exports.ChannelsModule = ChannelsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([
                channel_orm_entity_1.ChannelOrmEntity,
                channel_subscription_orm_entity_1.ChannelSubscriptionOrmEntity,
                membership_tier_orm_entity_1.MembershipTierOrmEntity,
                video_orm_entity_1.VideoOrmEntity,
            ]),
        ],
        controllers: [channel_controller_1.ChannelController, membership_tier_controller_1.MembershipTierController],
        providers: [
            channel_application_service_1.ChannelApplicationService,
            channel_repository_impl_1.ChannelRepositoryImpl,
            channel_subscription_repository_impl_1.ChannelSubscriptionRepositoryImpl,
            membership_tier_repository_impl_1.MembershipTierRepositoryImpl,
            channel_subscription_mapper_1.ChannelSubscriptionMapper,
            membership_payment_consumer_1.MembershipPaymentConsumer,
        ],
        exports: [
            channel_repository_impl_1.ChannelRepositoryImpl,
            channel_subscription_repository_impl_1.ChannelSubscriptionRepositoryImpl,
            membership_tier_repository_impl_1.MembershipTierRepositoryImpl,
            channel_application_service_1.ChannelApplicationService,
        ],
    })
], ChannelsModule);
//# sourceMappingURL=channels.module.js.map