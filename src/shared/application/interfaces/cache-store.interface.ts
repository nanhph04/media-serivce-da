export const TEXT_CACHE = Symbol('TEXT_CACHE');
export const IDEMPOTENCY_STORE = Symbol('IDEMPOTENCY_STORE');

export interface ITextCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
}

export interface IIdempotencyStore {
  exists(key: string): Promise<boolean>;
  setIfNotExists(
    key: string,
    value: string,
    ttlSeconds?: number,
  ): Promise<boolean>;
  delete(key: string): Promise<void>;
}
