import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ReviewChannelMembershipRequestDto {
  @IsIn(['approve', 'reject'])
  @IsNotEmpty()
  action!: 'approve' | 'reject';

  @IsString()
  @IsOptional()
  reason?: string;
}
