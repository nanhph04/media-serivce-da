import { ApiProperty } from '@nestjs/swagger';
import type {
  AdminChannelListItemResponse,
  AdminChannelsPageResponse,
} from '../../application/dtos/admin-channel-list.response';

class AdminChannelListItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  bio!: string;

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
  avatarUrl!: string;

  @ApiProperty()
  bannerUrl!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromApplicationDto(
    dto: AdminChannelListItemResponse,
  ): AdminChannelListItemResponseDto {
    const response = new AdminChannelListItemResponseDto();
    response.id = dto.id;
    response.userId = dto.userId;
    response.name = dto.name;
    response.bio = dto.bio;
    response.isEligibleForMembership = dto.isEligibleForMembership;
    response.isMembershipClosedByAdmin = dto.isMembershipClosedByAdmin;
    response.membershipReviewStatus = dto.membershipReviewStatus;
    response.membershipRejectionReason = dto.membershipRejectionReason;
    response.membershipRequestedAt =
      dto.membershipRequestedAt?.toISOString() ?? null;
    response.membershipReviewedAt =
      dto.membershipReviewedAt?.toISOString() ?? null;
    response.avatarUrl = dto.avatarUrl;
    response.bannerUrl = dto.bannerUrl;
    response.status = dto.status;
    response.createdAt = dto.createdAt.toISOString();
    response.updatedAt = dto.updatedAt.toISOString();

    return response;
  }
}

class AdminChannelsPaginationResponseDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class AdminChannelsResponseDto {
  @ApiProperty({ type: AdminChannelListItemResponseDto, isArray: true })
  items!: AdminChannelListItemResponseDto[];

  @ApiProperty({ type: AdminChannelsPaginationResponseDto })
  pagination!: AdminChannelsPaginationResponseDto;

  static fromApplicationDto(
    dto: AdminChannelsPageResponse,
  ): AdminChannelsResponseDto {
    const response = new AdminChannelsResponseDto();
    response.items = dto.items.map((item) =>
      AdminChannelListItemResponseDto.fromApplicationDto(item),
    );
    response.pagination = dto.pagination;

    return response;
  }
}
