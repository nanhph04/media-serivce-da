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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelSubscriptionOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const channel_subscription_entity_1 = require("../../domain/entities/channel-subscription.entity");
let ChannelSubscriptionOrmEntity = class ChannelSubscriptionOrmEntity {
    id;
    userId;
    channelId;
    membershipId;
    expiryDate;
    retryCount;
    status;
    createdAt;
    updatedAt;
};
exports.ChannelSubscriptionOrmEntity = ChannelSubscriptionOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ChannelSubscriptionOrmEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, name: 'user_id' }),
    __metadata("design:type", String)
], ChannelSubscriptionOrmEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, name: 'channel_id' }),
    __metadata("design:type", String)
], ChannelSubscriptionOrmEntity.prototype, "channelId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, name: 'membership_id' }),
    __metadata("design:type", String)
], ChannelSubscriptionOrmEntity.prototype, "membershipId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', name: 'expiry_date', nullable: true }),
    __metadata("design:type", Object)
], ChannelSubscriptionOrmEntity.prototype, "expiryDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'retry_count', default: 0 }),
    __metadata("design:type", Number)
], ChannelSubscriptionOrmEntity.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: channel_subscription_entity_1.SubscriptionStatus }),
    __metadata("design:type", String)
], ChannelSubscriptionOrmEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ChannelSubscriptionOrmEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ChannelSubscriptionOrmEntity.prototype, "updatedAt", void 0);
exports.ChannelSubscriptionOrmEntity = ChannelSubscriptionOrmEntity = __decorate([
    (0, typeorm_1.Entity)('channel_subscriptions'),
    (0, typeorm_1.Index)(['userId', 'channelId'], { unique: true })
], ChannelSubscriptionOrmEntity);
//# sourceMappingURL=channel-subscription.orm-entity.js.map