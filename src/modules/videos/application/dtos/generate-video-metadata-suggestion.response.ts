export interface VideoMetadataSuggestionTagResponse {
  id: string;
  name: string;
  slug: string;
}

export interface GenerateVideoMetadataSuggestionResponse {
  title: string;
  description: string;
  hashtags: string[];
  suggestedTags: VideoMetadataSuggestionTagResponse[];
  provider: string;
  model: string;
}
