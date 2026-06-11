import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import {
  OBJECT_STORAGE_SERVICE,
  type IObjectStorageService,
} from '@shared/application/interfaces/object-storage.service.interface';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  type IVideoRepository,
  VIDEO_REPOSITORY,
} from '../../domain/repositories/video.repository';
import {
  type IVideoUploadSessionRepository,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';
import {
  mapVideoEntityToStudioListItem,
  type StudioVideoListItemResponse,
} from '../dtos/studio-video-list-item.response';

@Injectable()
export class GetStudioVideoDetailUseCase extends BaseUseCase<
  { userId: string; videoId: string },
  StudioVideoListItemResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    private readonly uploadSessionRepository: IVideoUploadSessionRepository,
    @Inject(OBJECT_STORAGE_SERVICE)
    private readonly objectStorageService?: IObjectStorageService,
  ) {
    super();
  }

  async execute(command: {
    userId: string;
    videoId: string;
  }): Promise<StudioVideoListItemResponse> {
    const video = await this.videoRepository.findById(command.videoId);
    if (!video) {
      throw new NotFoundException(ERROR_MESSAGES.VIDEO_NOT_FOUND);
    }
    if (video.ownerId !== command.userId) {
      throw new ForbiddenException(ERROR_MESSAGES.VIDEO_NOT_OWNED);
    }

    const activeUploadSession = await this.uploadSessionRepository.findActiveByVideoId(
      video.id,
    );

    return mapVideoEntityToStudioListItem(
      video,
      this.objectStorageService,
      activeUploadSession,
    );
  }
}
