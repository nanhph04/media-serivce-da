export type VideoMetadataSuggestionLanguage = 'vi' | 'en';
export type VideoMetadataSuggestionTone = 'natural' | 'professional' | 'seo';

export interface GenerateVideoMetadataSuggestionCommand {
  userId: string;
  traceId?: string;
  title: string;
  description?: string;
  categoryId: string;
  tagIds: string[];
  language: VideoMetadataSuggestionLanguage;
  tone: VideoMetadataSuggestionTone;
  maxDescriptionLength: number;
}
