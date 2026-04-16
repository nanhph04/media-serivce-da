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
exports.ChannelOrmEntity = void 0;
const typeorm_1 = require("typeorm");
const channel_entity_1 = require("../../domain/entities/channel.entity");
let ChannelOrmEntity = class ChannelOrmEntity {
    id;
    userId;
    name;
    bio;
    avatarUrl;
    bannerUrl;
    status;
    isEligibleForMembership;
    createdAt;
    updatedAt;
};
exports.ChannelOrmEntity = ChannelOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], ChannelOrmEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, name: 'user_id' }),
    __metadata("design:type", String)
], ChannelOrmEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], ChannelOrmEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ChannelOrmEntity.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, name: 'avatar_url' }),
    __metadata("design:type", String)
], ChannelOrmEntity.prototype, "avatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, name: 'banner_url' }),
    __metadata("design:type", String)
], ChannelOrmEntity.prototype, "bannerUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: channel_entity_1.ChannelStatus }),
    __metadata("design:type", String)
], ChannelOrmEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_eligible_for_membership', default: false }),
    __metadata("design:type", Boolean)
], ChannelOrmEntity.prototype, "isEligibleForMembership", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ChannelOrmEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], ChannelOrmEntity.prototype, "updatedAt", void 0);
exports.ChannelOrmEntity = ChannelOrmEntity = __decorate([
    (0, typeorm_1.Entity)('channels'),
    (0, typeorm_1.Index)(['userId'], { unique: true })
], ChannelOrmEntity);
//# sourceMappingURL=channel.orm-entity.js.map