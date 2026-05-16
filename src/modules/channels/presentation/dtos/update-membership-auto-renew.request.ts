import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateMembershipAutoRenewRequestDto {
  @IsBoolean()
  @ApiProperty({ example: true })
  enabled!: boolean;
}
