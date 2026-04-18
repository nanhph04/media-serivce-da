import { Inject, Injectable } from '@nestjs/common';
import { ChannelEntity } from '../../domain/entities/channel.entity';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import {
  CHANNEL_REPOSITORY,
  type IChannelRepository,
} from '../../domain/repositories/channel.repository';
import type { CreateChannelCommand } from '../dtos/create-channel.command';
import type { ChannelResponse } from '../dtos/channel.response';

@Injectable()
export class CreateChannelUseCase extends BaseUseCase<
  CreateChannelCommand,
  ChannelResponse
> {
  constructor(
    @Inject(CHANNEL_REPOSITORY)
    private readonly channelRepository: IChannelRepository,
  ) {
    super();
  }

  async execute(command: CreateChannelCommand): Promise<ChannelResponse> {
    const existingChannel = await this.channelRepository.findByUserId(
      command.userId,
    );
    if (existingChannel) {
      throw new BadRequestException('Channel already exists');
    }
    const channel = ChannelEntity.create(command);
    await this.channelRepository.create(channel);
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
