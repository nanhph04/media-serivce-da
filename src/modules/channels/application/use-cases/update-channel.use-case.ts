import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import { ChannelStatus } from '../../domain/entities/channel.entity';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import type { ChannelResponse } from '../dtos/channel.response';
import type { UpdateChannelCommand } from '../dtos/update-channel.command';

@Injectable()
export class UpdateChannelUseCase extends BaseUseCase<
  UpdateChannelCommand,
  ChannelResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
  ) {
    super();
  }

  async execute(command: UpdateChannelCommand): Promise<ChannelResponse> {
    const channel = await this.channelRepository.findById(command.channelId);

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    if (channel.userId !== command.userId) {
      throw new ForbiddenException('You do not own this channel');
    }

    if (channel.status !== ChannelStatus.ACTIVE) {
      throw new ForbiddenException('Channel is not active');
    }

    channel.update({
      name: command.name,
      bio: command.bio,
      avatarUrl: command.avatarUrl,
      bannerUrl: command.bannerUrl,
    });

    await this.channelRepository.update(channel);

    return {
      id: channel.id,
      userId: channel.userId,
      name: channel.name,
      bio: channel.bio,
      isEligibleForMembership: channel.isEligibleForMembership,
      avatarUrl: channel.avatarUrl,
      bannerUrl: channel.bannerUrl,
      status: channel.status,
      createdAt: channel.createdAt,
      updatedAt: channel.updatedAt,
    };
  }
}
