import type { Readable } from 'stream';

export interface VideoThumbnailResponse {
  stream: Readable;
  contentType: string;
  cacheControl: string;
}
