import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import {
  VIDEO_REPOSITORY,
  type IVideoRepository,
} from '../../domain/repositories/video.repository';
import type { AdminVideoSummaryResponse } from '../dtos/admin-video.response';

interface GetAdminVideoSummaryQuery {
  adminId: string;
  role?: string;
}

@Injectable()
export class GetAdminVideoSummaryUseCase extends BaseUseCase<
  GetAdminVideoSummaryQuery,
  AdminVideoSummaryResponse
> {
  constructor(
    @Inject(VIDEO_REPOSITORY)
    private readonly videoRepository: IVideoRepository,
  ) {
    super();
  }

  async execute(
    query: GetAdminVideoSummaryQuery,
  ): Promise<AdminVideoSummaryResponse> {
    this.ensureNonEmpty(query.adminId, 'Admin id is required');
    this.ensureAdminRole(query.role);

    return this.videoRepository.getAdminVideoSummary();
  }

  private ensureNonEmpty(value: string, message: string): void {
    if (!value.trim()) {
      throw new BadRequestException(message);
    }
  }

  private ensureAdminRole(role: string | undefined): void {
    if (role !== 'admin') {
      throw new ForbiddenException(ERROR_MESSAGES.ADMIN_ROLE_REQUIRED);
    }
  }
}
