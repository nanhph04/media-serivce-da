import { Inject, Injectable } from '@nestjs/common';
import { ERROR_MESSAGES } from '@shared/domain/constants/error-messages.constant';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  BadRequestException,
  ForbiddenException,
} from '@shared/domain/exceptions/domain.exception';
import {
  ChannelStatus,
  type ChannelEntity,
} from '../../domain/entities/channel.entity';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import type { AdminChannelsPageResponse } from '../dtos/admin-channel-list.response';
import type { ChannelResponse } from '../dtos/channel.response';
import type { ListAdminChannelsQuery } from '../dtos/list-admin-channels.query';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

@Injectable()
export class ListAdminChannelsUseCase extends BaseUseCase<
  ListAdminChannelsQuery,
  AdminChannelsPageResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
  ) {
    super();
  }

  async execute(
    query: ListAdminChannelsQuery,
  ): Promise<AdminChannelsPageResponse> {
    this.ensureNonEmpty(query.adminId, 'Admin id is required');
    this.ensureAdminRole(query.role);

    const page = this.normalizePositiveInteger(query.page, DEFAULT_PAGE);
    const limit = Math.min(
      this.normalizePositiveInteger(query.limit, DEFAULT_LIMIT),
      MAX_LIMIT,
    );
    const result = await this.channelRepository.findAdminChannels({
      page,
      limit,
      status: this.parseStatus(query.status),
      ownerId: this.normalizeOptionalText(query.ownerId),
      q: this.normalizeOptionalText(query.q),
    });

    return {
      items: result.items.map((channel) => this.toChannelResponse(channel)),
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
      },
    };
  }

  private toChannelResponse(channel: ChannelEntity): ChannelResponse {
    return {
      id: channel.id,
      userId: channel.userId,
      name: channel.name,
      bio: channel.bio,
      isEligibleForMembership: channel.isEligibleForMembership,
      isMembershipClosedByAdmin: channel.isMembershipClosedByAdmin,
      membershipReviewStatus: channel.membershipReviewStatus,
      membershipRejectionReason: channel.membershipRejectionReason,
      membershipRequestedAt: channel.membershipRequestedAt,
      membershipReviewedAt: channel.membershipReviewedAt,
      avatarUrl: channel.avatarUrl,
      bannerUrl: channel.bannerUrl,
      status: channel.status,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
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

  private normalizePositiveInteger(
    value: number | undefined,
    fallback: number,
  ): number {
    if (value === undefined || !Number.isInteger(value) || value < 1) {
      return fallback;
    }

    return value;
  }

  private normalizeOptionalText(value?: string): string | undefined {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }

  private parseStatus(status?: string): ChannelStatus | undefined {
    if (!status) {
      return undefined;
    }

    if (Object.values(ChannelStatus).includes(status as ChannelStatus)) {
      return status as ChannelStatus;
    }

    throw new BadRequestException(ERROR_MESSAGES.CHANNEL_INVALID_STATUS);
  }
}
