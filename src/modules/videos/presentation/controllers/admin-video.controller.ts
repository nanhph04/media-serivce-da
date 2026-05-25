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
import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { ListAdminVideosUseCase } from '../../application/use-cases/list-admin-videos.use-case';
import { GetAdminVideoDetailUseCase } from '../../application/use-cases/get-admin-video-detail.use-case';
import { GetAdminVideoPreviewUseCase } from '../../application/use-cases/get-admin-video-preview.use-case';
import { ModerateAdminVideoUseCase } from '../../application/use-cases/moderate-admin-video.use-case';
import { AdminVideoQueryDto } from '../dtos/admin-video-query.dto';
import {
  AdminVideoListItemResponseDto,
  AdminVideosResponseDto,
} from '../dtos/admin-videos.response';
import { AdminVideoPreviewResponseDto } from '../dtos/admin-video-preview.response';
import { ModerateAdminVideoRequestDto } from '../dtos/moderate-admin-video.request';

@ApiTags('admin-videos')
@UseGuards(InternalGatewayGuard, AdminRoleGuard)
@Controller('admin/videos')
export class AdminVideoController {
  constructor(
    private readonly listAdminVideosUseCase: ListAdminVideosUseCase,
    private readonly getAdminVideoDetailUseCase: GetAdminVideoDetailUseCase,
    private readonly getAdminVideoPreviewUseCase: GetAdminVideoPreviewUseCase,
    private readonly moderateAdminVideoUseCase: ModerateAdminVideoUseCase,
  ) {}

  @Get()
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: VideoStatus })
  @ApiQuery({ name: 'visibility', required: false, enum: VideoVisibility })
  @ApiQuery({ name: 'channelId', required: false, type: String })
  @ApiQuery({ name: 'ownerId', required: false, type: String })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiSuccessResponse(AdminVideosResponseDto)
  async listVideos(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() role: string | undefined,
    @Query() query: AdminVideoQueryDto,
  ): Promise<ApiResponse<AdminVideosResponseDto>> {
    const result = await this.listAdminVideosUseCase.execute({
      adminId,
      role,
      page: query.page,
      limit: query.limit,
      status: query.status,
      visibility: query.visibility,
      channelId: query.channelId,
      ownerId: query.ownerId,
      q: query.q,
    });

    return apiResponseContract(
      AdminVideosResponseDto.fromApplicationDto(result),
    );
  }

  @Get(':id')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(AdminVideoListItemResponseDto)
  async getVideoDetail(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() role: string | undefined,
    @Param('id') videoId: string,
  ): Promise<ApiResponse<AdminVideoListItemResponseDto>> {
    const result = await this.getAdminVideoDetailUseCase.execute({
      adminId,
      role,
      videoId,
    });

    return apiResponseContract(
      AdminVideoListItemResponseDto.fromApplicationDto(result),
    );
  }

  @Get(':id/preview')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(AdminVideoPreviewResponseDto)
  async getVideoPreview(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() role: string | undefined,
    @Param('id') videoId: string,
  ): Promise<ApiResponse<AdminVideoPreviewResponseDto>> {
    const result = await this.getAdminVideoPreviewUseCase.execute({
      adminId,
      role,
      videoId,
    });

    return apiResponseContract(
      AdminVideoPreviewResponseDto.fromApplicationDto(result),
    );
  }

  @Patch(':id/moderation')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(AdminVideoListItemResponseDto)
  async moderateVideo(
    @CurrentUserId() adminId: string,
    @CurrentUserRole() role: string | undefined,
    @Param('id') videoId: string,
    @Body() dto: ModerateAdminVideoRequestDto,
  ): Promise<ApiResponse<AdminVideoListItemResponseDto>> {
    const result = await this.moderateAdminVideoUseCase.execute({
      adminId,
      role,
      videoId,
      action: dto.action,
      reason: dto.reason,
    });

    return apiResponseContract(
      AdminVideoListItemResponseDto.fromApplicationDto(result),
    );
  }
}
