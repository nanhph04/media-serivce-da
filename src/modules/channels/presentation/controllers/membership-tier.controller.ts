import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { CreateMembershipTierUseCase } from '../../application/use-cases/create-membership-tier.use-case';
import { DisableMembershipTierUseCase } from '../../application/use-cases/disable-membership-tier.use-case';
import { GetMembershipTierUseCase } from '../../application/use-cases/get-membership-tier.use-case';
import { GetMembershipTiersUseCase } from '../../application/use-cases/get-membership-tiers.use-case';
import { UpdateMembershipTierUseCase } from '../../application/use-cases/update-membership-tier.use-case';
import type { CreateMembershipTierRequestDto } from '../dtos/create-membership-tier.request';
import type { MembershipTierResponseDto } from '../dtos/membership-tier.response';
import type { UpdateMembershipTierRequestDto } from '../dtos/update-membership-tier.request';

@ApiTags('membership-tiers')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller('channels/:channelId/membership-tiers')
export class MembershipTierController {
  constructor(
    private readonly getMembershipTiersUseCase: GetMembershipTiersUseCase,
    private readonly getMembershipTierUseCase: GetMembershipTierUseCase,
    private readonly createMembershipTierUseCase: CreateMembershipTierUseCase,
    private readonly updateMembershipTierUseCase: UpdateMembershipTierUseCase,
    private readonly disableMembershipTierUseCase: DisableMembershipTierUseCase,
  ) {}

  @Get()
  async getMembershipTiers(
    @Param('channelId') channelId: string,
  ): Promise<MembershipTierResponseDto[]> {
    const appResult = await this.getMembershipTiersUseCase.execute({
      channelId,
    });
    return appResult.map((tier) => this.mapToResponseDto(tier));
  }

  @Get(':tierId')
  async getMembershipTier(
    @Param('channelId') channelId: string,
    @Param('tierId') tierId: string,
  ): Promise<MembershipTierResponseDto> {
    const appResult = await this.getMembershipTierUseCase.execute({
      channelId,
      tierId,
    });
    return this.mapToResponseDto(appResult);
  }

  @Post()
  async createMembershipTier(
    @CurrentUserId() userId: string,
    @Param('channelId') channelId: string,
    @Body() dto: CreateMembershipTierRequestDto,
  ): Promise<MembershipTierResponseDto> {
    const appResult = await this.createMembershipTierUseCase.execute({
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
    const appResult = await this.updateMembershipTierUseCase.execute({
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
    const appResult = await this.disableMembershipTierUseCase.execute({
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
