export const STREAM_CONFIG = Symbol('STREAM_CONFIG');

export interface IStreamConfig {
  getMasterPlaylistKeyCacheTtlSeconds(): number;
  getRewrittenPlaylistCacheTtlSeconds(): number;
}
