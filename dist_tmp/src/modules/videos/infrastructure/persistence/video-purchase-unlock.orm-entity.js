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
exports.VideoPurchaseUnlockOrmEntity = void 0;
const typeorm_1 = require("typeorm");
let VideoPurchaseUnlockOrmEntity = class VideoPurchaseUnlockOrmEntity {
    id;
    videoId;
    userId;
    createdAt;
    updatedAt;
};
exports.VideoPurchaseUnlockOrmEntity = VideoPurchaseUnlockOrmEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], VideoPurchaseUnlockOrmEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, name: 'video_id' }),
    __metadata("design:type", String)
], VideoPurchaseUnlockOrmEntity.prototype, "videoId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36, name: 'user_id' }),
    __metadata("design:type", String)
], VideoPurchaseUnlockOrmEntity.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], VideoPurchaseUnlockOrmEntity.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], VideoPurchaseUnlockOrmEntity.prototype, "updatedAt", void 0);
exports.VideoPurchaseUnlockOrmEntity = VideoPurchaseUnlockOrmEntity = __decorate([
    (0, typeorm_1.Entity)('video_purchase_unlocks'),
    (0, typeorm_1.Index)(['videoId', 'userId'], { unique: true })
], VideoPurchaseUnlockOrmEntity);
//# sourceMappingURL=video-purchase-unlock.orm-entity.js.map