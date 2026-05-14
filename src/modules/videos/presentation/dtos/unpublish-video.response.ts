import { ApiProperty } from '@nestjs/swagger';

export class UnpublishVideoResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  unpublished!: boolean;
}
