import { IsIn, IsNotEmpty } from 'class-validator';

export class ModerateChannelMembershipRequestDto {
  @IsIn(['close', 'open'])
  @IsNotEmpty()
  action!: 'close' | 'open';
}
