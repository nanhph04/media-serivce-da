import { IsIn, IsOptional } from 'class-validator';
import { MembershipReviewStatus } from '../../domain/entities/channel.entity';

export class MembershipReviewQueryRequestDto {
  @IsIn([
    MembershipReviewStatus.PENDING,
    MembershipReviewStatus.APPROVED,
    MembershipReviewStatus.REJECTED,
  ])
  @IsOptional()
  status?: MembershipReviewStatus;
}
