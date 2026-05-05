export const PLAYBACK_TOKEN_ISSUER = Symbol('PLAYBACK_TOKEN_ISSUER');
export const PLAYBACK_TOKEN_VERIFIER = Symbol('PLAYBACK_TOKEN_VERIFIER');

export interface PlaybackTokenPayload {
  videoId: string;
  userId: string;
  channelId: string;
  scope: 'stream';
  exp: number;
}

export interface IPlaybackTokenIssuer {
  issueToken(input: {
    videoId: string;
    userId: string;
    channelId: string;
  }): string;
}

export interface IPlaybackTokenVerifier {
  verifyToken(token: string | undefined, videoId: string): PlaybackTokenPayload;
}
