import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class LockChannelRequestDto {
  @IsIn(['lock', 'unlock'])
  @IsNotEmpty()
  action!: 'lock' | 'unlock';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
