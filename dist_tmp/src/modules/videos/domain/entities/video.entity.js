"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoEntity = exports.VideoVisibility = exports.VideoStatus = void 0;
const domain_exception_1 = require("@shared/domain/exceptions/domain.exception");
var VideoStatus;
(function (VideoStatus) {
    VideoStatus["DRAFT"] = "draft";
    VideoStatus["PROCESSING"] = "processing";
    VideoStatus["PUBLIC"] = "public";
    VideoStatus["FAILED"] = "failed";
})(VideoStatus || (exports.VideoStatus = VideoStatus = {}));
var VideoVisibility;
(function (VideoVisibility) {
    VideoVisibility["PUBLIC"] = "public";
    VideoVisibility["PRIVATE"] = "private";
})(VideoVisibility || (exports.VideoVisibility = VideoVisibility = {}));
class VideoEntity {
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
    get ownerId() {
        return this.props.ownerId;
    }
    get title() {
        return this.props.title;
    }
    get description() {
        return this.props.description;
    }
    get category() {
        return this.props.category;
    }
    get visibility() {
        return this.props.visibility;
    }
    get status() {
        return this.props.status;
    }
    get price() {
        return this.props.price;
    }
    get requiredTierLevel() {
        return this.props.requiredTierLevel;
    }
    get rawFileKey() {
        return this.props.rawFileKey;
    }
    get masterPlaylistKey() {
        return this.props.masterPlaylistKey;
    }
    get thumbnailUrl() {
        return this.props.thumbnailUrl;
    }
    get durationSeconds() {
        return this.props.durationSeconds;
    }
    get resolutions() {
        return this.props.resolutions;
    }
    get errorMessage() {
        return this.props.errorMessage;
    }
    get viewCount() {
        return this.props.viewCount;
    }
    get publishedAt() {
        return this.props.publishedAt;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    static create(input) {
        VideoEntity.validate(input.title, input.price, input.requiredTierLevel);
        const now = new Date();
        return new VideoEntity({
            id: crypto.randomUUID(),
            channelId: input.channelId,
            ownerId: input.ownerId,
            title: input.title,
            description: input.description,
            category: input.category,
            visibility: input.visibility,
            status: VideoStatus.DRAFT,
            price: input.price,
            requiredTierLevel: input.requiredTierLevel,
            rawFileKey: input.rawFileKey,
            masterPlaylistKey: null,
            thumbnailUrl: null,
            durationSeconds: null,
            resolutions: [],
            errorMessage: null,
            viewCount: 0,
            publishedAt: null,
            createdAt: now,
            updatedAt: now,
        });
    }
    markProcessing() {
        if (this.props.status !== VideoStatus.DRAFT) {
            throw new domain_exception_1.ConflictException('Video is not in draft status');
        }
        this.props.status = VideoStatus.PROCESSING;
        this.touch();
    }
    markPublic(input) {
        this.props.status = VideoStatus.PUBLIC;
        this.props.masterPlaylistKey = input.masterPlaylistKey;
        this.props.thumbnailUrl = input.thumbnailUrl ?? this.props.thumbnailUrl;
        this.props.durationSeconds =
            input.durationSeconds ?? this.props.durationSeconds;
        this.props.resolutions = input.resolutions ?? this.props.resolutions;
        this.props.errorMessage = null;
        this.props.publishedAt = new Date();
        this.touch();
    }
    markFailed(errorMessage) {
        this.props.status = VideoStatus.FAILED;
        this.props.errorMessage = errorMessage;
        this.touch();
    }
    incrementViewCount() {
        this.props.viewCount += 1;
        this.touch();
    }
    touch() {
        this.props.updatedAt = new Date();
    }
    static validate(title, price, requiredTierLevel) {
        if (!title || title.length > 200) {
            throw new domain_exception_1.BadRequestException('Video title is required and must be <= 200 characters');
        }
        if (price < 0) {
            throw new domain_exception_1.BadRequestException('Video price cannot be negative');
        }
        if (requiredTierLevel !== null &&
            (requiredTierLevel < 1 || requiredTierLevel > 3)) {
            throw new domain_exception_1.BadRequestException('Required tier level must be between 1 and 3');
        }
    }
}
exports.VideoEntity = VideoEntity;
//# sourceMappingURL=video.entity.js.map