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
exports.MembershipTierRepositoryImpl = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const membership_tier_entity_1 = require("../../domain/entities/membership-tier.entity");
const membership_tier_orm_entity_1 = require("./membership-tier.orm-entity");
let MembershipTierRepositoryImpl = class MembershipTierRepositoryImpl {
    ormRepository;
    constructor(ormRepository) {
        this.ormRepository = ormRepository;
    }
    async create(tier) {
        const ormEntity = {
            id: tier.id,
            channelId: tier.channelId,
            name: tier.name,
            level: tier.level,
            priceCoin: tier.priceCoin,
            isAcceptingNew: tier.isAcceptingNew,
            createdAt: tier.createdAt,
            updatedAt: tier.updatedAt,
        };
        await this.ormRepository.save(ormEntity);
    }
    async update(tier) {
        await this.ormRepository.save({
            id: tier.id,
            channelId: tier.channelId,
            name: tier.name,
            level: tier.level,
            priceCoin: tier.priceCoin,
            isAcceptingNew: tier.isAcceptingNew,
            createdAt: tier.createdAt,
            updatedAt: tier.updatedAt,
        });
    }
    async delete(id) {
        await this.ormRepository.delete({ id });
    }
    async findById(id) {
        const ormEntity = await this.ormRepository.findOne({ where: { id } });
        if (!ormEntity) {
            return null;
        }
        return new membership_tier_entity_1.MembershipTierEntity({
            id: ormEntity.id,
            channelId: ormEntity.channelId,
            name: ormEntity.name,
            level: ormEntity.level,
            priceCoin: ormEntity.priceCoin,
            isAcceptingNew: ormEntity.isAcceptingNew,
            createdAt: ormEntity.createdAt,
            updatedAt: ormEntity.updatedAt,
        });
    }
    async findByChannelId(channelId) {
        const ormEntities = await this.ormRepository.find({
            where: { channelId },
            order: { level: 'ASC' },
        });
        return ormEntities.map((ormEntity) => new membership_tier_entity_1.MembershipTierEntity({
            id: ormEntity.id,
            channelId: ormEntity.channelId,
            name: ormEntity.name,
            level: ormEntity.level,
            priceCoin: ormEntity.priceCoin,
            isAcceptingNew: ormEntity.isAcceptingNew,
            createdAt: ormEntity.createdAt,
            updatedAt: ormEntity.updatedAt,
        }));
    }
};
exports.MembershipTierRepositoryImpl = MembershipTierRepositoryImpl;
exports.MembershipTierRepositoryImpl = MembershipTierRepositoryImpl = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(membership_tier_orm_entity_1.MembershipTierOrmEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MembershipTierRepositoryImpl);
//# sourceMappingURL=membership-tier.repository.impl.js.map