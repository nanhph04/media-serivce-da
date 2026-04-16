import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { ChannelApplicationService } from '../../application/channel.application.service';
import type { CreateChannelRequestDto } from '../dtos/create-channel.request';
import type { UpdateChannelRequestDto } from '../dtos/update-channel.request';
import type { ChannelResponseDto } from '../dtos/channel.response';
import type {
  ChannelDetailResponseDto,
  ChannelSubscriptionStatusResponseDto,
} from '../dtos/channel-detail.response';

@ApiTags('channels')
@ApiHeader({ name: 'x-user-id', required: true })
@Controller('channels')
export class ChannelController {
  constructor(
    private readonly channelApplicationService: ChannelApplicationService,
  ) {}

  @Post()
  async createChannel(
    @CurrentUserId() userId: string,
    @Body() dto: CreateChannelRequestDto,
  ): Promise<ChannelResponseDto> {
    const channel = await this.channelApplicationService.createChannel({
      userId,
      name: dto.name,
      bio: dto.bio,
    });
    return this.mapToResponseDto(channel);
  }

  @Patch(':id')
  async updateChannel(
    @CurrentUserId() userId: string,
    @Param('id') channelId: string,
    @Body() dto: UpdateChannelRequestDto,
  ): Promise<ChannelResponseDto> {
    const channel = await this.channelApplicationService.updateChannel({
      channelId,
      userId,
      name: dto.name,
      bio: dto.bio,
      avatarUrl: dto.avatarUrl,
      bannerUrl: dto.bannerUrl,
    });
    return this.mapToResponseDto(channel);
  }

  @Get(':id')
  async getChannelDetail(
    @Param('id') channelId: string,
  ): Promise<ChannelDetailResponseDto> {
    const result =
      await this.channelApplicationService.getChannelDetail(channelId);
    return {
      id: result.channel.id,
      userId: result.channel.userId,
      name: result.channel.name,
      bio: result.channel.bio,
      avatarUrl: result.channel.avatarUrl,
      bannerUrl: result.channel.bannerUrl,
      status: result.channel.status,
      membershipTiers: result.membershipTiers.map((tier) => ({
        id: tier.id,
        channelId: tier.channelId,
        name: tier.name,
        level: tier.level,
        priceCoin: tier.priceCoin,
        isAcceptingNew: tier.isAcceptingNew,
        createdAt: tier.createdAt.toISOString(),
        updatedAt: tier.updatedAt.toISOString(),
      })),
      publicVideos: result.publicVideos.map((video) => ({
        id: video.id,
        title: video.title,
        category: video.category,
        status: video.status,
        thumbnailUrl: video.thumbnailUrl,
        publishedAt: video.publishedAt?.toISOString() ?? null,
      })),
    };
  }

  @Get(':id/subscription-status')
  async getSubscriptionStatus(
    @CurrentUserId() userId: string,
    @Param('id') channelId: string,
  ): Promise<ChannelSubscriptionStatusResponseDto> {
    const status = await this.channelApplicationService.getSubscriptionStatus({
      channelId,
      userId,
    });
    return {
      isActive: status.isActive,
      membershipId: status.membershipId,
      expiryDate: status.expiryDate?.toISOString() ?? null,
    };
  }

  private mapToResponseDto(app: {
    id: string;
    userId: string;
    name: string;
    bio: string;
    isEligibleForMembership: boolean;
    avatarUrl: string;
    bannerUrl: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }): ChannelResponseDto {
    return {
      id: app.id,
      userId: app.userId,
      name: app.name,
      bio: app.bio,
      isEligibleForMembership: app.isEligibleForMembership,
      avatarUrl: app.avatarUrl,
      bannerUrl: app.bannerUrl,
      status: app.status,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  }
}
