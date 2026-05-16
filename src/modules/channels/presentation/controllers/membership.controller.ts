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
import { ApiResponse } from '@shared/presentation/dto/api-response.dto';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { GetMyMembershipsUseCase } from '../../application/use-cases/get-my-memberships.use-case';
import { UpdateMembershipAutoRenewUseCase } from '../../application/use-cases/update-membership-auto-renew.use-case';
import { ChannelMembershipResponseDto } from '../dtos/channel-membership.response';
import { MyMembershipItemResponseDto } from '../dtos/my-membership-item.response';
import { UpdateMembershipAutoRenewRequestDto } from '../dtos/update-membership-auto-renew.request';
import { toMyMembershipItemResponseDto } from '../mappers/channel-response.mapper';

@ApiTags('memberships')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller('memberships')
export class MembershipController {
  constructor(
    private readonly getMyMembershipsUseCase: GetMyMembershipsUseCase,
    private readonly updateMembershipAutoRenewUseCase: UpdateMembershipAutoRenewUseCase,
  ) {}

  @Get('me')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(MyMembershipItemResponseDto, { isArray: true })
  async getMyMemberships(
    @CurrentUserId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<MyMembershipItemResponseDto[]>> {
    const result = await this.getMyMembershipsUseCase.execute({
      userId,
      page: this.parsePage(page),
      limit: this.parseLimit(limit),
    });

    return ApiResponse.success(
      result.items.map(toMyMembershipItemResponseDto),
      undefined,
      result.pagination,
    );
  }

  @Patch(':membershipId/auto-renew')
  @ApiSuccessResponse(ChannelMembershipResponseDto)
  async updateAutoRenew(
    @CurrentUserId() userId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateMembershipAutoRenewRequestDto,
  ): Promise<ApiResponse<ChannelMembershipResponseDto>> {
    const membership = await this.updateMembershipAutoRenewUseCase.execute({
      userId,
      membershipId,
      enabled: dto.enabled,
    });

    return ApiResponse.success(
      ChannelMembershipResponseDto.fromApplicationDto(membership),
    );
  }

  private parseLimit(limit?: string): number {
    const parsed = Number(limit) || 20;
    return Math.min(Math.max(parsed, 1), 50);
  }

  private parsePage(page?: string): number {
    const parsed = Number(page) || 1;
    return Math.max(parsed, 1);
  }
}
