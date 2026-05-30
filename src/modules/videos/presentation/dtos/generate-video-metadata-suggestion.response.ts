import { ApiProperty } from '@nestjs/swagger';
import type { GenerateVideoMetadataSuggestionResponse } from '../../application/dtos/generate-video-metadata-suggestion.response';

class VideoMetadataSuggestionTagResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class GenerateVideoMetadataSuggestionResponseDto {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ type: [String] })
  hashtags!: string[];

  @ApiProperty({ type: [VideoMetadataSuggestionTagResponseDto] })
  suggestedTags!: VideoMetadataSuggestionTagResponseDto[];

  @ApiProperty()
  provider!: string;

  @ApiProperty()
  model!: string;

  static fromApplicationDto(
    suggestion: GenerateVideoMetadataSuggestionResponse,
  ): GenerateVideoMetadataSuggestionResponseDto {
    return {
      title: suggestion.title,
      description: suggestion.description,
      hashtags: suggestion.hashtags,
      suggestedTags: suggestion.suggestedTags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
      provider: suggestion.provider,
      model: suggestion.model,
    };
  }
}
