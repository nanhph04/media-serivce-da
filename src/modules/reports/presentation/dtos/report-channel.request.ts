import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReportChannelRequestDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(36)
  reportedVideoId?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reportedVideoTitle?: string;
}
