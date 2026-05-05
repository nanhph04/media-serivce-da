export const VIDEO_UPLOAD_CONFIG = Symbol('VIDEO_UPLOAD_CONFIG');

export interface IVideoUploadConfig {
  getMaxVideoUploadSizeBytes(): number;
}
