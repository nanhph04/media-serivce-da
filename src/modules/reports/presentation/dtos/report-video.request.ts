import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ReportVideoRequestDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason!: string;

  @ApiPropertyOptional({ minimum: 0, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  evidenceTimestampSeconds?: number | null;
}
