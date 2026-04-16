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
exports.MembershipTierOrmEntity = void 0;
const typeorm_1 = require("typeorm");
let MembershipTierOrmEntity = class MembershipTierOrmEntity {
    id;
    channelId;
    name;
    level;
    priceCoin;
    isAcceptingNew;
    createdAt;
    updatedAt;
};
exports.MembershipTierOrmEntity = MembershipTierOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], MembershipTierOrmEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, name: 'channel_id' }),
    __metadata("design:type", String)
], MembershipTierOrmEntity.prototype, "channelId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], MembershipTierOrmEntity.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], MembershipTierOrmEntity.prototype, "level", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'price_coin' }),
    __metadata("design:type", Number)
], MembershipTierOrmEntity.prototype, "priceCoin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', name: 'is_accepting_new', default: true }),
    __metadata("design:type", Boolean)
], MembershipTierOrmEntity.prototype, "isAcceptingNew", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], MembershipTierOrmEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], MembershipTierOrmEntity.prototype, "updatedAt", void 0);
exports.MembershipTierOrmEntity = MembershipTierOrmEntity = __decorate([
    (0, typeorm_1.Entity)('membership_tiers')
], MembershipTierOrmEntity);
//# sourceMappingURL=membership-tier.orm-entity.js.map