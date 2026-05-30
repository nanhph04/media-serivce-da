import type {
  VideoMetadataSuggestionLanguage,
  VideoMetadataSuggestionTone,
} from '../dtos/generate-video-metadata-suggestion.command';

export const VIDEO_METADATA_SUGGESTION_GENERATOR = Symbol(
  'VIDEO_METADATA_SUGGESTION_GENERATOR',
);

export interface VideoMetadataSuggestionTagInput {
  id: string;
  name: string;
  slug: string;
}

export interface GenerateVideoMetadataSuggestionInput {
  title: string;
  description: string;
  categoryName: string;
  categorySlug: string;
  selectedTags: VideoMetadataSuggestionTagInput[];
  allowedTags: VideoMetadataSuggestionTagInput[];
  language: VideoMetadataSuggestionLanguage;
  tone: VideoMetadataSuggestionTone;
  maxDescriptionLength: number;
  traceId?: string;
}

export interface GenerateVideoMetadataSuggestionOutput {
  title: string;
  description: string;
  hashtags: string[];
  suggestedTagSlugs: string[];
  provider: string;
  model: string;
}

export interface IVideoMetadataSuggestionGenerator {
  generate(
    input: GenerateVideoMetadataSuggestionInput,
  ): Promise<GenerateVideoMetadataSuggestionOutput>;
}
