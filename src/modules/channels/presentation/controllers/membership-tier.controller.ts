import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { ChannelApplicationService } from '../../application/channel.application.service';
import type { CreateMembershipTierRequestDto } from '../dtos/create-membership-tier.request';
import type { MembershipTierResponseDto } from '../dtos/membership-tier.response';
import type { UpdateMembershipTierRequestDto } from '../dtos/update-membership-tier.request';

@ApiTags('membership-tiers')
@ApiHeader({ name: 'x-user-id', required: true })
@Controller('channels/:channelId/membership-tiers')
export class MembershipTierController {
  constructor(
    private readonly channelApplicationService: ChannelApplicationService,
  ) {}

  @Get()
  async getMembershipTiers(
    @Param('channelId') channelId: string,
  ): Promise<MembershipTierResponseDto[]> {
    const appResult = await this.channelApplicationService.getTiers(channelId);
    return appResult.map((tier) => this.mapToResponseDto(tier));
  }

  @Get(':tierId')
  async getMembershipTier(
    @Param('channelId') channelId: string,
    @Param('tierId') tierId: string,
  ): Promise<MembershipTierResponseDto> {
    const appResult = await this.channelApplicationService.getTier(
      channelId,
      tierId,
    );
    return this.mapToResponseDto(appResult);
  }

  @Post()
  async createMembershipTier(
    @CurrentUserId() userId: string,
    @Param('channelId') channelId: string,
    @Body() dto: CreateMembershipTierRequestDto,
  ): Promise<MembershipTierResponseDto> {
    const appResult = await this.channelApplicationService.createTier({
      channelId,
      userId,
      name: dto.name,
      level: dto.level,
      priceCoin: dto.priceCoin,
    });
    return this.mapToResponseDto(appResult);
  }

  @Patch(':tierId')
  async updateMembershipTier(
    @CurrentUserId() userId: string,
    @Param('channelId') channelId: string,
    @Param('tierId') tierId: string,
    @Body() dto: UpdateMembershipTierRequestDto,
  ): Promise<MembershipTierResponseDto> {
    const appResult = await this.channelApplicationService.updateTier({
      channelId,
      tierId,
      userId,
      name: dto.name,
      priceCoin: dto.priceCoin,
      isAcceptingNew: dto.isAcceptingNew,
    });
    return this.mapToResponseDto(appResult);
  }

  @Delete(':tierId')
  async deleteMembershipTier(
    @CurrentUserId() userId: string,
    @Param('channelId') channelId: string,
    @Param('tierId') tierId: string,
  ): Promise<MembershipTierResponseDto> {
    const appResult = await this.channelApplicationService.disableTier({
      channelId,
      tierId,
      userId,
    });
    return this.mapToResponseDto(appResult);
  }

  private mapToResponseDto = (app: {
    id: string;
    channelId: string;
    name: string;
    level: number;
    priceCoin: number;
    isAcceptingNew: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): MembershipTierResponseDto => {
    return {
      id: app.id,
      channelId: app.channelId,
      name: app.name,
      level: app.level,
      priceCoin: app.priceCoin,
      isAcceptingNew: app.isAcceptingNew,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  };
}
