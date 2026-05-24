import { ApiProperty } from '@nestjs/swagger';
import { VideoListItemResponseDto } from '../../../videos/presentation/dtos/video-list-item.response';
import { ChannelSearchItemResponseDto } from './channel-search-item.response';

export class SearchContentQueryResponseDto {
  @ApiProperty({ nullable: true })
  q!: string | null;

  @ApiProperty({ nullable: true })
  category!: string | null;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}

export class SearchContentResponseDto {
  @ApiProperty({ type: [VideoListItemResponseDto] })
  videos!: VideoListItemResponseDto[];

  @ApiProperty({ type: [ChannelSearchItemResponseDto] })
  channels!: ChannelSearchItemResponseDto[];

  @ApiProperty({ type: SearchContentQueryResponseDto })
  query!: SearchContentQueryResponseDto;
}
