"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoPurchaseUnlockEntity = void 0;
class VideoPurchaseUnlockEntity {
    props;
    constructor(props) {
        this.props = props;
    }
    get id() {
        return this.props.id;
    }
    get videoId() {
        return this.props.videoId;
    }
    get userId() {
        return this.props.userId;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    static create(input) {
        const now = new Date();
        return new VideoPurchaseUnlockEntity({
            id: crypto.randomUUID(),
            videoId: input.videoId,
            userId: input.userId,
            createdAt: now,
            updatedAt: now,
        });
    }
}
exports.VideoPurchaseUnlockEntity = VideoPurchaseUnlockEntity;
//# sourceMappingURL=video-purchase-unlock.entity.js.map