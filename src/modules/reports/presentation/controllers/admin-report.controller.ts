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
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { CurrentUserRole } from '@shared/presentation/decorators/user-role.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { AdminRoleGuard } from '@shared/presentation/guards/admin-role.guard';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { GetAdminReportsSummaryUseCase } from '../../application/use-cases/get-admin-reports-summary.use-case';
import { ListAdminReportsUseCase } from '../../application/use-cases/list-admin-reports.use-case';
import { UpdateAdminReportStatusUseCase } from '../../application/use-cases/update-admin-report-status.use-case';
import { AdminReportQueryDto } from '../dtos/admin-report-query.dto';
import { AdminReportStatusRequestDto } from '../dtos/admin-report-status.request';
import { AdminReportsResponseDto } from '../dtos/admin-reports.response';
import { AdminReportsSummaryResponseDto } from '../dtos/admin-reports-summary.response';
import { ContentReportResponseDto } from '../dtos/content-report.response';

@ApiTags('admin-reports')
@UseGuards(InternalGatewayGuard, AdminRoleGuard)
@Controller('admin/reports')
export class AdminReportController {
  constructor(
    private readonly getAdminReportsSummaryUseCase: GetAdminReportsSummaryUseCase,
    private readonly listAdminReportsUseCase: ListAdminReportsUseCase,
    private readonly updateAdminReportStatusUseCase: UpdateAdminReportStatusUseCase,
  ) {}

  @Get('summary')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(AdminReportsSummaryResponseDto)
  async getSummary(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() role: string | undefined,
  ): Promise<ApiResponse<AdminReportsSummaryResponseDto>> {
    const summary = await this.getAdminReportsSummaryUseCase.execute({
      adminId,
      role,
    });

    return apiResponseContract(
      AdminReportsSummaryResponseDto.fromApplicationDto(summary),
    );
  }

  @Get()
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'resolved', 'dismissed', 'rejected'],
  })
  @ApiQuery({ name: 'targetType', required: false, enum: ['video', 'channel'] })
  @ApiQuery({
    name: 'source',
    required: false,
    enum: ['user', 'auto_moderation'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(AdminReportsResponseDto)
  async listReports(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() role: string | undefined,
    @Query() query: AdminReportQueryDto,
  ): Promise<ApiResponse<AdminReportsResponseDto>> {
    const result = await this.listAdminReportsUseCase.execute({
      adminId,
      role,
      status: query.status,
      targetType: query.targetType,
      source: query.source,
      page: query.page,
      limit: query.limit,
    });

    return apiResponseContract(
      AdminReportsResponseDto.fromApplicationDto(result),
    );
  }

  @Patch(':id/status')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(ContentReportResponseDto)
  async updateReportStatus(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() role: string | undefined,
    @Param('id') reportId: string,
    @Body() dto: AdminReportStatusRequestDto,
  ): Promise<ApiResponse<ContentReportResponseDto>> {
    const report = await this.updateAdminReportStatusUseCase.execute({
      adminId,
      role,
      reportId,
      status: dto.status,
    });

    return apiResponseContract(
      ContentReportResponseDto.fromApplicationDto(report),
    );
  }
}
