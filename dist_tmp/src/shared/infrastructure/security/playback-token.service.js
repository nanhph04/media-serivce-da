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
exports.PlaybackTokenService = void 0;
const crypto_1 = require("crypto");
const common_1 = require("@nestjs/common");
const config_service_1 = require("../config/config.service");
const domain_exception_1 = require("../../domain/exceptions/domain.exception");
let PlaybackTokenService = class PlaybackTokenService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    issueToken(input) {
        const payload = {
            ...input,
            scope: 'stream',
            exp: Math.floor(Date.now() / 1000) +
                this.configService.getNumber('PLAYBACK_TOKEN_TTL_SECONDS', 300),
        };
        const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
        const signature = this.sign(encodedPayload);
        return `${encodedPayload}.${signature}`;
    }
    verifyToken(token, videoId) {
        const [encodedPayload, signature] = token.split('.');
        if (!encodedPayload || !signature) {
            throw new domain_exception_1.UnauthorizedException('Invalid playback token');
        }
        const expectedSignature = this.sign(encodedPayload);
        if (!(0, crypto_1.timingSafeEqual)(Buffer.from(signature), Buffer.from(expectedSignature))) {
            throw new domain_exception_1.UnauthorizedException('Invalid playback token');
        }
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            throw new domain_exception_1.UnauthorizedException('Playback token expired');
        }
        if (payload.videoId !== videoId || payload.scope !== 'stream') {
            throw new domain_exception_1.ForbiddenException('Playback token is not valid for this video');
        }
        return payload;
    }
    sign(encodedPayload) {
        return (0, crypto_1.createHmac)('sha256', this.configService.get('PLAYBACK_TOKEN_SECRET', 'change-me-in-production'))
            .update(encodedPayload)
            .digest('base64url');
    }
    base64UrlEncode(value) {
        return Buffer.from(value).toString('base64url');
    }
};
exports.PlaybackTokenService = PlaybackTokenService;
exports.PlaybackTokenService = PlaybackTokenService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], PlaybackTokenService);
//# sourceMappingURL=playback-token.service.js.map