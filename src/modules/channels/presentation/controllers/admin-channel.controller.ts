import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { MembershipReviewStatus } from '../../domain/entities/channel.entity';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { CurrentUserRole } from '@shared/presentation/decorators/user-role.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { GetAdminChannelSummaryUseCase } from '../../application/use-cases/get-admin-channel-summary.use-case';
import { ListMembershipReviewsUseCase } from '../../application/use-cases/list-membership-reviews.use-case';
import { ReviewChannelMembershipUseCase } from '../../application/use-cases/review-channel-membership.use-case';
import { AdminChannelSummaryResponseDto } from '../dtos/admin-channel-summary.response';
import { MembershipReviewQueryRequestDto } from '../dtos/membership-review-query.request';
import { MembershipReviewResponseDto } from '../dtos/membership-review.response';
import { ReviewChannelMembershipRequestDto } from '../dtos/review-channel-membership.request';
import { ChannelResponseDto } from '../dtos/channel.response';
import { toChannelResponseDto } from '../mappers/channel-response.mapper';

@ApiTags('admin-channels')
@UseGuards(InternalGatewayGuard)
@Controller('admin/channels')
export class AdminChannelController {
  constructor(
    private readonly getAdminChannelSummaryUseCase: GetAdminChannelSummaryUseCase,
    private readonly listMembershipReviewsUseCase: ListMembershipReviewsUseCase,
    private readonly reviewChannelMembershipUseCase: ReviewChannelMembershipUseCase,
  ) {}

  @Get('summary')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(AdminChannelSummaryResponseDto)
  async getSummary(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() role: string | undefined,
  ): Promise<ApiResponse<AdminChannelSummaryResponseDto>> {
    const summary = await this.getAdminChannelSummaryUseCase.execute({
      adminId,
      role,
    });

    return apiResponseContract(
      AdminChannelSummaryResponseDto.fromApplicationDto(summary),
    );
  }

  @Get('membership-reviews')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(MembershipReviewResponseDto)
  async listMembershipReviews(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() role: string | undefined,
    @Query() query: MembershipReviewQueryRequestDto,
  ): Promise<ApiResponse<MembershipReviewResponseDto[]>> {
    const reviews = await this.listMembershipReviewsUseCase.execute({
      adminId,
      role,
      status: query.status ?? MembershipReviewStatus.PENDING,
    });

    return apiResponseContract(
      reviews.map(MembershipReviewResponseDto.fromApplicationDto),
    );
  }

  @Patch(':id/membership-review')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(ChannelResponseDto)
  async reviewMembership(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() role: string | undefined,
    @Param('id') channelId: string,
    @Body() dto: ReviewChannelMembershipRequestDto,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    const channel = await this.reviewChannelMembershipUseCase.execute({
      channelId,
      adminId,
      role,
      action: dto.action,
      reason: dto.reason,
    });

    return apiResponseContract(toChannelResponseDto(channel));
  }
}
