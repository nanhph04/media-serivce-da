import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';

import { ApiCreatedSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentRequestId } from '@shared/presentation/decorators/request-id.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';

import { PurchaseMembershipUseCase } from '../../application/use-cases/purchase-membership.use-case';
import { PurchaseMembershipResponseDto } from '../dtos/purchase-membership.response';

@ApiTags('memberships')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller('channels/:channelId/memberships')
export class MembershipPurchaseController {
  constructor(
    private readonly purchaseMembershipUseCase: PurchaseMembershipUseCase,
  ) {}

  @Post(':tierId/purchase')
  @ApiCreatedSuccessResponse(PurchaseMembershipResponseDto)
  public async purchaseMembership(
    @CurrentUserId() userId: string,
    @CurrentRequestId() traceId: string,
    @Param('channelId') channelId: string,
    @Param('tierId') tierId: string,
  ): Promise<ApiResponse<PurchaseMembershipResponseDto>> {
    const response = await this.purchaseMembershipUseCase.execute({
      userId,
      traceId,
      channelId,
      tierId,
    });

    return apiResponseContract(
      PurchaseMembershipResponseDto.fromApplicationDto(response),
    );
  }
}
