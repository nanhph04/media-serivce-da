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
import { ApiCreatedSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { CreateChannelUseCase } from '../../application/use-cases/create-channel.use-case';
import { GetChannelDetailUseCase } from '../../application/use-cases/get-channel-detail.use-case';
import { GetMembershipStatusUseCase } from '../../application/use-cases/get-membership-status.use-case';
import { UpdateChannelUseCase } from '../../application/use-cases/update-channel.use-case';
import { CreateChannelRequestDto } from '../dtos/create-channel.request';
import { UpdateChannelRequestDto } from '../dtos/update-channel.request';
import { ChannelResponseDto } from '../dtos/channel.response';
import {
  ChannelDetailResponseDto,
  ChannelMembershipStatusResponseDto,
} from '../dtos/channel-detail.response';
import {
  toChannelDetailResponseDto,
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
    private readonly getChannelDetailUseCase: GetChannelDetailUseCase,
    private readonly getMembershipStatusUseCase: GetMembershipStatusUseCase,
  ) {}

  @Post()
  @ApiCreatedSuccessResponse(ChannelResponseDto)
  async createChannel(
    @CurrentUserId() userId: string,
    @Body() dto: CreateChannelRequestDto,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    const channel = await this.createChannelUseCase.execute({
      userId,
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
}
