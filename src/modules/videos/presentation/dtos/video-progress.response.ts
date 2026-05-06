import { ApiProperty } from '@nestjs/swagger';

export class VideoProgressResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  stage!: string;

  @ApiProperty()
  percent!: number;

  @ApiProperty()
  message!: string;

  @ApiProperty()
  terminal!: boolean;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ required: false, nullable: true })
  detail?: Record<string, unknown> | null;

  @ApiProperty({ required: false, nullable: true })
  errorCode?: string | null;
}
