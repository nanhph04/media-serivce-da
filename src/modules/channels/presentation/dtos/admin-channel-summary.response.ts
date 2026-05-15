import { ApiProperty } from '@nestjs/swagger';
import type { AdminChannelSummaryResponse } from '../../application/dtos/admin-channel-summary.response';

export class AdminChannelSummaryResponseDto {
  @ApiProperty()
  totalChannels!: number;

  @ApiProperty()
  activeCreators30d!: number;

  @ApiProperty()
  eligibleForMembership!: number;

  @ApiProperty()
  membershipClosedByAdmin!: number;

  @ApiProperty()
  uploadingNow!: number;

  static fromApplicationDto(
    dto: AdminChannelSummaryResponse,
  ): AdminChannelSummaryResponseDto {
    const response = new AdminChannelSummaryResponseDto();
    response.totalChannels = dto.totalChannels;
    response.activeCreators30d = dto.activeCreators30d;
    response.eligibleForMembership = dto.eligibleForMembership;
    response.membershipClosedByAdmin = dto.membershipClosedByAdmin;
    response.uploadingNow = dto.uploadingNow;

    return response;
  }
}
