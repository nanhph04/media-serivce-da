export interface VideoProcessedSkippedResolution {
  resolution: string;
  reason?: string;
}

export interface VideoProcessedSuccessEventData {
  videoId: string;
  masterPlaylistKey: string;
  durationSeconds?: number;
  thumbnailUrl?: string | null;
  resolution?: string[];
  skippedResolutions?: VideoProcessedSkippedResolution[];
}
