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
exports.StreamingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const streaming_application_service_1 = require("../../application/streaming.application.service");
let StreamingController = class StreamingController {
    streamingApplicationService;
    constructor(streamingApplicationService) {
        this.streamingApplicationService = streamingApplicationService;
    }
    async getMasterPlaylist(videoId, token, response) {
        const playlist = await this.streamingApplicationService.streamMasterPlaylist(videoId, token);
        response.type('application/vnd.apple.mpegurl').send(playlist);
    }
    async getSegment(videoId, segmentName, token, response) {
        await this.streamingApplicationService.pipeSegment({
            videoId,
            segmentName: decodeURIComponent(segmentName),
            token,
        }, response);
    }
};
exports.StreamingController = StreamingController;
__decorate([
    (0, common_1.Get)(':videoId/master.m3u8'),
    (0, swagger_1.ApiQuery)({ name: 'token', required: true }),
    __param(0, (0, common_1.Param)('videoId')),
    __param(1, (0, common_1.Query)('token')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], StreamingController.prototype, "getMasterPlaylist", null);
__decorate([
    (0, common_1.Get)(':videoId/segments/:segmentName'),
    (0, swagger_1.ApiQuery)({ name: 'token', required: true }),
    __param(0, (0, common_1.Param)('videoId')),
    __param(1, (0, common_1.Param)('segmentName')),
    __param(2, (0, common_1.Query)('token')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], StreamingController.prototype, "getSegment", null);
exports.StreamingController = StreamingController = __decorate([
    (0, swagger_1.ApiTags)('streaming'),
    (0, common_1.Controller)('stream'),
    __metadata("design:paramtypes", [streaming_application_service_1.StreamingApplicationService])
], StreamingController);
//# sourceMappingURL=streaming.controller.js.map