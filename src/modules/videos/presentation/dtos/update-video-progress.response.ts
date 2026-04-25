import { ApiProperty } from '@nestjs/swagger';

export class UpdateVideoProgressResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  positionSeconds!: number;

  @ApiProperty()
  completed!: boolean;
}
