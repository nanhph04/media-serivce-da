import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { CurrentUserRole } from '@shared/presentation/decorators/user-role.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { GetAdminChannelSummaryUseCase } from '../../application/use-cases/get-admin-channel-summary.use-case';
import { AdminChannelSummaryResponseDto } from '../dtos/admin-channel-summary.response';

@ApiTags('admin-channels')
@UseGuards(InternalGatewayGuard)
@Controller('admin/channels')
export class AdminChannelController {
  constructor(
    private readonly getAdminChannelSummaryUseCase: GetAdminChannelSummaryUseCase,
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
}
