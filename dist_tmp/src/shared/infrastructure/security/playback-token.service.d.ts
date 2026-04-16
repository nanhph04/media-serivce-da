import { ConfigService } from '../config/config.service';
export interface PlaybackTokenPayload {
    videoId: string;
    userId: string;
    channelId: string;
    scope: 'stream';
    exp: number;
}
export declare class PlaybackTokenService {
    private readonly configService;
    constructor(configService: ConfigService);
    issueToken(input: {
        videoId: string;
        userId: string;
        channelId: string;
    }): string;
    verifyToken(token: string, videoId: string): PlaybackTokenPayload;
    private sign;
    private base64UrlEncode;
}
