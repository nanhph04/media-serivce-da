export const VIDEO_UPLOAD_RESOLUTIONS = ['480p', '720p', '1080p'] as const;
export type VideoUploadResolution = (typeof VIDEO_UPLOAD_RESOLUTIONS)[number];
