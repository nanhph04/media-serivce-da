"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelEntity = exports.ChannelStatus = void 0;
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
var ChannelStatus;
(function (ChannelStatus) {
    ChannelStatus["ACTIVE"] = "active";
    ChannelStatus["INACTIVE"] = "inactive";
    ChannelStatus["SUSPENDED"] = "suspended";
})(ChannelStatus || (exports.ChannelStatus = ChannelStatus = {}));
class ChannelEntity {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    get userId() {
        return this.props.userId;
    }
    get name() {
        return this.props.name;
    }
    get bio() {
        return this.props.bio;
    }
    get avatarUrl() {
        return this.props.avatarUrl;
    }
    get bannerUrl() {
        return this.props.bannerUrl;
    }
    get status() {
        return this.props.status;
    }
    get isEligibleForMembership() {
        return this.props.isEligibleForMembership;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    static create(input) {
        if (input.name.length > 100) {
            throw new domain_exception_1.BadRequestException('Channel name must be less than 100 characters');
        }
        if (input.bio.length > 1000) {
            throw new domain_exception_1.BadRequestException('Channel bio must be less than 1000 characters');
        }
        return new ChannelEntity({
            id: crypto.randomUUID(),
            userId: input.userId,
            name: input.name,
            bio: input.bio,
            avatarUrl: '',
            bannerUrl: '',
            status: ChannelStatus.ACTIVE,
            isEligibleForMembership: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    update(input) {
        if (input.name !== undefined) {
            if (input.name.length > 100) {
                throw new domain_exception_1.BadRequestException('Channel name must be less than 100 characters');
            }
            this.props.name = input.name;
        }
        if (input.bio !== undefined) {
            if (input.bio.length > 1000) {
                throw new domain_exception_1.BadRequestException('Channel bio must be less than 1000 characters');
            }
            this.props.bio = input.bio;
        }
        if (input.avatarUrl !== undefined) {
            this.props.avatarUrl = input.avatarUrl;
        }
        if (input.bannerUrl !== undefined) {
            this.props.bannerUrl = input.bannerUrl;
        }
        if (input.status !== undefined) {
            this.props.status = input.status;
        }
        this.props.updatedAt = new Date();
    }
    delete() {
        this.props.status = ChannelStatus.INACTIVE;
        this.props.updatedAt = new Date();
    }
    restore() {
        this.props.status = ChannelStatus.ACTIVE;
        this.props.updatedAt = new Date();
    }
    suspend() {
        this.props.status = ChannelStatus.SUSPENDED;
        this.props.updatedAt = new Date();
    }
}
exports.ChannelEntity = ChannelEntity;
//# sourceMappingURL=channel.entity.js.map