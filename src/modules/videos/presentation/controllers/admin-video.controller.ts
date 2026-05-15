import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { CurrentUserRole } from '@shared/presentation/decorators/user-role.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { ListAdminVideosUseCase } from '../../application/use-cases/list-admin-videos.use-case';
import { AdminVideoQueryDto } from '../dtos/admin-video-query.dto';
import { AdminVideosResponseDto } from '../dtos/admin-videos.response';

@ApiTags('admin-videos')
@UseGuards(InternalGatewayGuard)
@Controller('admin/videos')
export class AdminVideoController {
  constructor(private readonly listAdminVideosUseCase: ListAdminVideosUseCase) {}

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
}
