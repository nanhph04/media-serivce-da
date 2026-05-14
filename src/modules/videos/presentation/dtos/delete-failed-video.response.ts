import { ApiProperty } from '@nestjs/swagger';

export class DeleteFailedVideoResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  deleted!: boolean;
}
