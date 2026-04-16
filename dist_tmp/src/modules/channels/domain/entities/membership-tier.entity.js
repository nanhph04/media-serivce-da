"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipTierEntity = void 0;
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
class MembershipTierEntity {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    get channelId() {
        return this.props.channelId;
    }
    get name() {
        return this.props.name;
    }
    get level() {
        return this.props.level;
    }
    get priceCoin() {
        return this.props.priceCoin;
    }
    get isAcceptingNew() {
        return this.props.isAcceptingNew;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    static create(input) {
        if (input.name.length > 50) {
            throw new domain_exception_1.BadRequestException('Membership tier name must be less than 50 characters');
        }
        if (input.priceCoin < 0) {
            throw new domain_exception_1.BadRequestException('Price coin cannot be negative');
        }
        if (input.level < 1) {
            throw new domain_exception_1.BadRequestException('Level must be greater than or equal to 1');
        }
        return new MembershipTierEntity({
            id: crypto.randomUUID(),
            channelId: input.channelId,
            name: input.name,
            level: input.level,
            priceCoin: input.priceCoin,
            isAcceptingNew: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    update(input) {
        if (input.name !== undefined) {
            if (input.name.length > 50) {
                throw new domain_exception_1.BadRequestException('Membership tier name must be less than 50 characters');
            }
            this.props.name = input.name;
        }
        if (input.level !== undefined) {
            if (input.level < 1) {
                throw new domain_exception_1.BadRequestException('Level must be greater than or equal to 1');
            }
            this.props.level = input.level;
        }
        if (input.priceCoin !== undefined) {
            if (input.priceCoin < 0) {
                throw new domain_exception_1.BadRequestException('Price coin cannot be negative');
            }
            this.props.priceCoin = input.priceCoin;
        }
        if (input.isAcceptingNew !== undefined) {
            this.props.isAcceptingNew = input.isAcceptingNew;
        }
        this.props.updatedAt = new Date();
    }
    hide() {
        this.props.isAcceptingNew = false;
        this.props.updatedAt = new Date();
    }
    show() {
        this.props.isAcceptingNew = true;
        this.props.updatedAt = new Date();
    }
}
exports.MembershipTierEntity = MembershipTierEntity;
//# sourceMappingURL=membership-tier.entity.js.map