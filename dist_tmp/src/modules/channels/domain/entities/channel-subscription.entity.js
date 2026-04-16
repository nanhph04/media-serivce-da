"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelSubscriptionEntity = exports.SubscriptionStatus = void 0;
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["CANCELLED"] = "cancelled";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
class ChannelSubscriptionEntity {
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
    get channelId() {
        return this.props.channelId;
    }
    get membershipId() {
        return this.props.membershipId;
    }
    get expiryDate() {
        return this.props.expiryDate;
    }
    get retryCount() {
        return this.props.retryCount;
    }
    get status() {
        return this.props.status;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    static create(input) {
        return new ChannelSubscriptionEntity({
            id: crypto.randomUUID(),
            userId: input.userId,
            channelId: input.channelId,
            membershipId: input.membershipId,
            expiryDate: input.expiryDate,
            retryCount: 0,
            status: SubscriptionStatus.ACTIVE,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }
    cancel() {
        if (this.props.status === SubscriptionStatus.CANCELLED) {
            return;
        }
        this.props.status = SubscriptionStatus.CANCELLED;
        this.props.updatedAt = new Date();
    }
    reactivate() {
        if (this.props.status === SubscriptionStatus.ACTIVE) {
            return;
        }
        this.props.status = SubscriptionStatus.ACTIVE;
        this.props.updatedAt = new Date();
    }
    isActive() {
        return this.props.status === SubscriptionStatus.ACTIVE;
    }
    syncMembership(input) {
        this.props.membershipId = input.membershipId;
        this.props.expiryDate = input.expiryDate;
        this.props.status = SubscriptionStatus.ACTIVE;
        this.props.updatedAt = new Date();
    }
    isCurrentlyActive() {
        if (this.props.status !== SubscriptionStatus.ACTIVE) {
            return false;
        }
        if (!this.props.expiryDate) {
            return true;
        }
        return this.props.expiryDate.getTime() > Date.now();
    }
}
exports.ChannelSubscriptionEntity = ChannelSubscriptionEntity;
//# sourceMappingURL=channel-subscription.entity.js.map