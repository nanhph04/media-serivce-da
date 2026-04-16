import { IsIn, IsNotEmpty } from 'class-validator';

export class LockChannelRequestDto {
  @IsIn(['lock', 'unlock'])
  @IsNotEmpty()
  action!: 'lock' | 'unlock';
}
