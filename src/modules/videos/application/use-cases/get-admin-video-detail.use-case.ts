import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../domain/repositories/video.repository';
import type { AdminVideoDetailResponse } from '../dtos/admin-video.response';
import type { GetAdminVideoDetailQuery } from '../dtos/get-admin-video-detail.query';
import { mapVideoEntityToStudioListItem } from '../dtos/studio-video-list-item.response';

@Injectable()
export class GetAdminVideoDetailUseCase extends BaseUseCase<
  GetAdminVideoDetailQuery,
  AdminVideoDetailResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {
    super();
  }

  async execute(
    query: GetAdminVideoDetailQuery,
  ): Promise<AdminVideoDetailResponse> {
    this.ensureNonEmpty(query.adminId, 'Admin id is required');
    this.ensureAdminRole(query.role);
    this.ensureNonEmpty(query.videoId, 'Video id is required');

    const video = await this.videoRepository.findAdminVideoById(query.videoId);
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return {
      ...mapVideoEntityToStudioListItem(video),
      ownerId: video.ownerId,
    };
  }

  private ensureNonEmpty(value: string, message: string): void {
    if (!value.trim()) {
      throw new BadRequestException(message);
    }
  }

  private ensureAdminRole(role: string | undefined): void {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }
  }
}
