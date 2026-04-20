import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiSuccessEnvelopeDto {
  @ApiProperty({ example: true })
  success!: true;

  @ApiProperty({ example: 200 })
  code!: number;

  @ApiPropertyOptional()
  mess?: string;
}
