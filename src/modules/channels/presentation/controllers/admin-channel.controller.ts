import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MembershipReviewStatus } from '../../domain/entities/channel.entity';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { CurrentUserRole } from '@shared/presentation/decorators/user-role.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { AdminRoleGuard } from '@shared/presentation/guards/admin-role.guard';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { AdminLockChannelUseCase } from '../../application/use-cases/admin-lock-channel.use-case';
import { GetAdminChannelSummaryUseCase } from '../../application/use-cases/get-admin-channel-summary.use-case';
import { ListAdminChannelsUseCase } from '../../application/use-cases/list-admin-channels.use-case';
import { ListMembershipReviewsUseCase } from '../../application/use-cases/list-membership-reviews.use-case';
import { ModerateChannelMembershipUseCase } from '../../application/use-cases/moderate-channel-membership.use-case';
import { ReviewChannelMembershipUseCase } from '../../application/use-cases/review-channel-membership.use-case';
import { AdminChannelQueryDto } from '../dtos/admin-channel-query.dto';
import { AdminChannelsResponseDto } from '../dtos/admin-channels.response';
import { AdminChannelSummaryResponseDto } from '../dtos/admin-channel-summary.response';
import { MembershipReviewQueryRequestDto } from '../dtos/membership-review-query.request';
import { MembershipReviewResponseDto } from '../dtos/membership-review.response';
import { ModerateChannelMembershipRequestDto } from '../dtos/moderate-channel-membership.request';
import { ReviewChannelMembershipRequestDto } from '../dtos/review-channel-membership.request';
import { ChannelResponseDto } from '../dtos/channel.response';
import { LockChannelRequestDto } from '../dtos/lock-channel.request';
import { toChannelResponseDto } from '../mappers/channel-response.mapper';

@ApiTags('admin-channels')
@UseGuards(InternalGatewayGuard, AdminRoleGuard)
@Controller('admin/channels')
export class AdminChannelController {
  constructor(
    private readonly adminLockChannelUseCase: AdminLockChannelUseCase,
    private readonly getAdminChannelSummaryUseCase: GetAdminChannelSummaryUseCase,
    private readonly listAdminChannelsUseCase: ListAdminChannelsUseCase,
    private readonly listMembershipReviewsUseCase: ListMembershipReviewsUseCase,
    private readonly reviewChannelMembershipUseCase: ReviewChannelMembershipUseCase,
    private readonly moderateChannelMembershipUseCase: ModerateChannelMembershipUseCase,
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

  @Get()
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'ownerId', required: false, type: String })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiSuccessResponse(AdminChannelsResponseDto)
  async listChannels(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() role: string | undefined,
    @Query() query: AdminChannelQueryDto,
  ): Promise<ApiResponse<AdminChannelsResponseDto>> {
    const result = await this.listAdminChannelsUseCase.execute({
      adminId,
      role,
      page: query.page,
      limit: query.limit,
      status: query.status,
      ownerId: query.ownerId,
      q: query.q,
    });

    return apiResponseContract(
      AdminChannelsResponseDto.fromApplicationDto(result),
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
      reviews.map((review) =>
        MembershipReviewResponseDto.fromApplicationDto(review),
      ),
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

  @Patch(':id/membership')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(ChannelResponseDto)
  async moderateMembership(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() _role: string | undefined,
    @Param('id') channelId: string,
    @Body() dto: ModerateChannelMembershipRequestDto,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    const channel = await this.moderateChannelMembershipUseCase.execute({
      channelId,
      adminId,
      action: dto.action,
    });

    return apiResponseContract(toChannelResponseDto(channel));
  }

  @Patch(':id/status')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(ChannelResponseDto)
  async updateChannelStatus(
    @CurrentUserId() adminId: string,
    @Param('id') channelId: string,
    @Body() dto: LockChannelRequestDto,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    const channel = await this.adminLockChannelUseCase.execute({
      channelId,
      adminId,
      action: dto.action,
      reason: dto.reason,
    });

    return apiResponseContract(toChannelResponseDto(channel));
  }
}
