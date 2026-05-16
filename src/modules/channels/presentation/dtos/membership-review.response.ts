import { ApiProperty } from '@nestjs/swagger';
import type { MembershipReviewResponse } from '../../application/dtos/membership-review.response';

export class MembershipReviewResponseDto {
  @ApiProperty()
  channelId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  isEligibleForMembership!: boolean;

  @ApiProperty()
  isMembershipClosedByAdmin!: boolean;

  @ApiProperty()
  membershipReviewStatus!: string;

  @ApiProperty({ nullable: true })
  membershipRejectionReason!: string | null;

  @ApiProperty({ nullable: true })
  membershipRequestedAt!: string | null;

  @ApiProperty({ nullable: true })
  membershipReviewedAt!: string | null;

  @ApiProperty()
  readyVideoCount!: number;

  @ApiProperty()
  minReadyVideoCount!: number;

  @ApiProperty()
  totalVideoViews!: number;

  @ApiProperty()
  minTotalVideoViews!: number;

  static fromApplicationDto(
    dto: MembershipReviewResponse,
  ): MembershipReviewResponseDto {
    const response = new MembershipReviewResponseDto();
    response.channelId = dto.channelId;
    response.userId = dto.userId;
    response.name = dto.name;
    response.status = dto.status;
    response.isEligibleForMembership = dto.isEligibleForMembership;
    response.isMembershipClosedByAdmin = dto.isMembershipClosedByAdmin;
    response.membershipReviewStatus = dto.membershipReviewStatus;
    response.membershipRejectionReason = dto.membershipRejectionReason;
    response.membershipRequestedAt =
      dto.membershipRequestedAt?.toISOString() ?? null;
    response.membershipReviewedAt =
      dto.membershipReviewedAt?.toISOString() ?? null;
    response.readyVideoCount = dto.readyVideoCount;
    response.minReadyVideoCount = dto.minReadyVideoCount;
    response.totalVideoViews = dto.totalVideoViews;
    response.minTotalVideoViews = dto.minTotalVideoViews;

    return response;
  }
}
