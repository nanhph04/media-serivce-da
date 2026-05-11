import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ForbiddenException } from '@shared/domain/exceptions/domain.exception';
import { ApiCreatedSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentRequestId } from '@shared/presentation/decorators/request-id.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { CurrentUserRole } from '@shared/presentation/decorators/user-role.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { CreateChannelUseCase } from '../../application/use-cases/create-channel.use-case';
import { GetCurrentChannelUseCase } from '../../application/use-cases/get-current-channel.use-case';
import { GetChannelDetailUseCase } from '../../application/use-cases/get-channel-detail.use-case';
import { GetMembershipStatusUseCase } from '../../application/use-cases/get-membership-status.use-case';
import { ModerateChannelMembershipUseCase } from '../../application/use-cases/moderate-channel-membership.use-case';
import { UpdateChannelUseCase } from '../../application/use-cases/update-channel.use-case';
import { CreateChannelRequestDto } from '../dtos/create-channel.request';
import { ModerateChannelMembershipRequestDto } from '../dtos/moderate-channel-membership.request';
import { UpdateChannelRequestDto } from '../dtos/update-channel.request';
import { ChannelResponseDto } from '../dtos/channel.response';
import { CurrentChannelResponseDto } from '../dtos/current-channel.response';
import {
  ChannelDetailResponseDto,
  ChannelMembershipStatusResponseDto,
} from '../dtos/channel-detail.response';
import {
  toChannelDetailResponseDto,
  toCurrentChannelResponseDto,
  toChannelMembershipStatusResponseDto,
  toChannelResponseDto,
} from '../mappers/channel-response.mapper';

@ApiTags('channels')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller('channels')
export class ChannelController {
  constructor(
    private readonly createChannelUseCase: CreateChannelUseCase,
    private readonly updateChannelUseCase: UpdateChannelUseCase,
    private readonly getCurrentChannelUseCase: GetCurrentChannelUseCase,
    private readonly getChannelDetailUseCase: GetChannelDetailUseCase,
    private readonly getMembershipStatusUseCase: GetMembershipStatusUseCase,
    private readonly moderateChannelMembershipUseCase: ModerateChannelMembershipUseCase,
  ) {}

  @Post()
  @ApiCreatedSuccessResponse(ChannelResponseDto)
  async createChannel(
    @CurrentUserId() userId: string,
    @CurrentRequestId() traceId: string,
    @Body() dto: CreateChannelRequestDto,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    const channel = await this.createChannelUseCase.execute({
      userId,
      traceId,
      name: dto.name,
      bio: dto.bio,
    });
    return apiResponseContract(toChannelResponseDto(channel));
  }

  @Patch(':id')
  @ApiSuccessResponse(ChannelResponseDto)
  async updateChannel(
    @CurrentUserId() userId: string,
    @Param('id') channelId: string,
    @Body() dto: UpdateChannelRequestDto,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    const channel = await this.updateChannelUseCase.execute({
      channelId,
      userId,
      name: dto.name,
      bio: dto.bio,
      avatarUrl: dto.avatarUrl,
      bannerUrl: dto.bannerUrl,
    });
    return apiResponseContract(toChannelResponseDto(channel));
  }

  @Get('me')
  @ApiSuccessResponse(CurrentChannelResponseDto)
  async getCurrentChannel(
    @CurrentUserId() userId: string,
  ): Promise<ApiResponse<CurrentChannelResponseDto>> {
    const result = await this.getCurrentChannelUseCase.execute({ userId });
    return apiResponseContract(toCurrentChannelResponseDto(result));
  }

  @Get(':id')
  @SkipInternalGatewayGuard()
  @ApiSuccessResponse(ChannelDetailResponseDto)
  async getChannelDetail(
    @Param('id') channelId: string,
  ): Promise<ApiResponse<ChannelDetailResponseDto>> {
    const result = await this.getChannelDetailUseCase.execute({ channelId });
    return apiResponseContract(toChannelDetailResponseDto(result));
  }

  @Get(':id/membership-status')
  @ApiSuccessResponse(ChannelMembershipStatusResponseDto)
  async getMembershipStatus(
    @CurrentUserId() userId: string,
    @Param('id') channelId: string,
  ): Promise<ApiResponse<ChannelMembershipStatusResponseDto>> {
    const status = await this.getMembershipStatusUseCase.execute({
      channelId,
      userId,
    });
    return apiResponseContract(toChannelMembershipStatusResponseDto(status));
  }

  @Patch(':id/admin/membership')
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiSuccessResponse(ChannelResponseDto)
  async moderateMembership(
    @CurrentUserId() userId: string,
    @CurrentUserRole() role: string | undefined,
    @Param('id') channelId: string,
    @Body() dto: ModerateChannelMembershipRequestDto,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    this.assertAdmin(role);

    const channel = await this.moderateChannelMembershipUseCase.execute({
      channelId,
      adminId: userId,
      action: dto.action,
    });

    return apiResponseContract(toChannelResponseDto(channel));
  }

  private assertAdmin(role: string | undefined): void {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }
  }
}
