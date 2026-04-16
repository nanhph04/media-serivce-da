import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { CreateChannelCommand } from '../dtos/create-channel.command';
import { ChannelEntity } from '../../domain/entities/channel.entity';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { ChannelResponse } from '../dtos/channel.response';
import { BadRequestException } from '@shared/domain/exceptions/domain.exception';

export class CreateChannelUseCase extends BaseUseCase<
  CreateChannelCommand,
  ChannelResponse
> {
  constructor(private readonly channelRepository: IChannelRepository) {
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
