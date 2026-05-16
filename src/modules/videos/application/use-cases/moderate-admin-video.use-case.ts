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
import type { ModerateAdminVideoCommand } from '../dtos/moderate-admin-video.command';
import { mapVideoEntityToStudioListItem } from '../dtos/studio-video-list-item.response';
import {
  type IVideoCacheInvalidator,
  VIDEO_CACHE_INVALIDATOR,
} from '../interfaces/video-cache-invalidator.interface';

@Injectable()
export class ModerateAdminVideoUseCase extends BaseUseCase<
  ModerateAdminVideoCommand,
  AdminVideoDetailResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_CACHE_INVALIDATOR)
    private readonly videoCacheInvalidator: IVideoCacheInvalidator,
  ) {
    super();
  }

  async execute(
    command: ModerateAdminVideoCommand,
  ): Promise<AdminVideoDetailResponse> {
    this.ensureNonEmpty(command.adminId, 'Admin id is required');
    this.ensureAdminRole(command.role);
    this.ensureNonEmpty(command.videoId, 'Video id is required');

    const video = await this.videoRepository.findAdminVideoById(
      command.videoId,
    );
    if (!video) {
      throw new NotFoundException('Video not found');
    }

    if (command.action === 'approve') {
      video.approveManualReview();
    } else {
      video.rejectManualReview(command.reason ?? '');
    }

    await this.videoRepository.save(video);
    await this.videoCacheInvalidator.invalidateMetadata(video.id);
    await this.videoCacheInvalidator.invalidateDiscoveryLists();

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
