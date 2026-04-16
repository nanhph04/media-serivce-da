import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import {
  ForbiddenException,
  UnauthorizedException,
} from '../../domain/exceptions/domain.exception';

export interface PlaybackTokenPayload {
  videoId: string;
  userId: string;
  channelId: string;
  scope: 'stream';
  exp: number;
}

@Injectable()
export class PlaybackTokenService {
  constructor(private readonly configService: ConfigService) {}

  issueToken(input: {
    videoId: string;
    userId: string;
    channelId: string;
  }): string {
    const payload: PlaybackTokenPayload = {
      ...input,
      scope: 'stream',
      exp:
        Math.floor(Date.now() / 1000) +
        this.configService.getNumber('PLAYBACK_TOKEN_TTL_SECONDS', 300),
    };

    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  verifyToken(token: string, videoId: string): PlaybackTokenPayload {
    const [encodedPayload, signature] = token.split('.');

    if (!encodedPayload || !signature) {
      throw new UnauthorizedException('Invalid playback token');
    }

    const expectedSignature = this.sign(encodedPayload);

    if (
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
    ) {
      throw new UnauthorizedException('Invalid playback token');
    }

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as PlaybackTokenPayload;

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Playback token expired');
    }

    if (payload.videoId !== videoId || payload.scope !== 'stream') {
      throw new ForbiddenException(
        'Playback token is not valid for this video',
      );
    }

    return payload;
  }

  private sign(encodedPayload: string): string {
    return createHmac(
      'sha256',
      this.configService.get<string>(
        'PLAYBACK_TOKEN_SECRET',
        'change-me-in-production',
      ),
    )
      .update(encodedPayload)
      .digest('base64url');
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value).toString('base64url');
  }
}
