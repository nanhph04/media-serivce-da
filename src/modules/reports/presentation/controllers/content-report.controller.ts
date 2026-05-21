import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ApiCreatedSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { ReportChannelUseCase } from '../../application/use-cases/report-channel.use-case';
import { ReportVideoUseCase } from '../../application/use-cases/report-video.use-case';
import { ContentReportResponseDto } from '../dtos/content-report.response';
import { ReportChannelRequestDto } from '../dtos/report-channel.request';
import { ReportVideoRequestDto } from '../dtos/report-video.request';

@ApiTags('reports')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller()
export class ContentReportController {
  constructor(
    private readonly reportChannelUseCase: ReportChannelUseCase,
    private readonly reportVideoUseCase: ReportVideoUseCase,
  ) {}

  @Post('videos/:id/reports')
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiCreatedSuccessResponse(ContentReportResponseDto)
  async reportVideo(
    @CurrentUserId() reporterUserId: string,
    @Param('id') videoId: string,
    @Body() dto: ReportVideoRequestDto,
  ): Promise<ApiResponse<ContentReportResponseDto>> {
    const report = await this.reportVideoUseCase.execute({
      reporterUserId,
      videoId,
      reason: dto.reason,
      evidenceTimestampSeconds: dto.evidenceTimestampSeconds,
    });

    return apiResponseContract(
      ContentReportResponseDto.fromApplicationDto(report),
    );
  }

  @Post('channels/:id/reports')
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiCreatedSuccessResponse(ContentReportResponseDto)
  async reportChannel(
    @CurrentUserId() reporterUserId: string,
    @Param('id') channelId: string,
    @Body() dto: ReportChannelRequestDto,
  ): Promise<ApiResponse<ContentReportResponseDto>> {
    const report = await this.reportChannelUseCase.execute({
      reporterUserId,
      channelId,
      reason: dto.reason,
      reportedVideoId: dto.reportedVideoId,
      reportedVideoTitle: dto.reportedVideoTitle,
    });

    return apiResponseContract(
      ContentReportResponseDto.fromApplicationDto(report),
    );
  }
}
