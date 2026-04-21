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
import { ApiCreatedSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { CreateMembershipTierUseCase } from '../../application/use-cases/create-membership-tier.use-case';
import { DisableMembershipTierUseCase } from '../../application/use-cases/disable-membership-tier.use-case';
import { GetMembershipTierUseCase } from '../../application/use-cases/get-membership-tier.use-case';
import { GetMembershipTiersUseCase } from '../../application/use-cases/get-membership-tiers.use-case';
import { UpdateMembershipTierUseCase } from '../../application/use-cases/update-membership-tier.use-case';
import { CreateMembershipTierRequestDto } from '../dtos/create-membership-tier.request';
import { MembershipTierResponseDto } from '../dtos/membership-tier.response';
import { UpdateMembershipTierRequestDto } from '../dtos/update-membership-tier.request';
import { toMembershipTierResponseDto } from '../mappers/channel-response.mapper';

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
  @ApiSuccessResponse(MembershipTierResponseDto, { isArray: true })
  async getMembershipTiers(
    @Param('channelId') channelId: string,
  ): Promise<ApiResponse<MembershipTierResponseDto[]>> {
    const appResult = await this.getMembershipTiersUseCase.execute({
      channelId,
    });
    return apiResponseContract(appResult.map(toMembershipTierResponseDto));
  }

  @Get(':tierId')
  @ApiSuccessResponse(MembershipTierResponseDto)
  async getMembershipTier(
    @Param('channelId') channelId: string,
    @Param('tierId') tierId: string,
  ): Promise<ApiResponse<MembershipTierResponseDto>> {
    const appResult = await this.getMembershipTierUseCase.execute({
      channelId,
      tierId,
    });
    return apiResponseContract(toMembershipTierResponseDto(appResult));
  }

  @Post()
  @ApiCreatedSuccessResponse(MembershipTierResponseDto)
  async createMembershipTier(
    @CurrentUserId() userId: string,
    @Param('channelId') channelId: string,
    @Body() dto: CreateMembershipTierRequestDto,
  ): Promise<ApiResponse<MembershipTierResponseDto>> {
    const appResult = await this.createMembershipTierUseCase.execute({
      channelId,
      userId,
      name: dto.name,
      level: dto.level,
      priceCoin: dto.priceCoin,
    });
    return apiResponseContract(toMembershipTierResponseDto(appResult));
  }

  @Patch(':tierId')
  @ApiSuccessResponse(MembershipTierResponseDto)
  async updateMembershipTier(
    @CurrentUserId() userId: string,
    @Param('channelId') channelId: string,
    @Param('tierId') tierId: string,
    @Body() dto: UpdateMembershipTierRequestDto,
  ): Promise<ApiResponse<MembershipTierResponseDto>> {
    const appResult = await this.updateMembershipTierUseCase.execute({
      channelId,
      tierId,
      userId,
      name: dto.name,
      priceCoin: dto.priceCoin,
      isAcceptingNew: dto.isAcceptingNew,
    });
    return apiResponseContract(toMembershipTierResponseDto(appResult));
  }

  @Delete(':tierId')
  @ApiSuccessResponse(MembershipTierResponseDto)
  async deleteMembershipTier(
    @CurrentUserId() userId: string,
    @Param('channelId') channelId: string,
    @Param('tierId') tierId: string,
  ): Promise<ApiResponse<MembershipTierResponseDto>> {
    const appResult = await this.disableMembershipTierUseCase.execute({
      channelId,
      tierId,
      userId,
    });
    return apiResponseContract(toMembershipTierResponseDto(appResult));
  }
}
