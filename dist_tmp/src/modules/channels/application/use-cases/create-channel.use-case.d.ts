import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { CreateChannelCommand } from '../dtos/create-channel.command';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import { ChannelResponse } from '../dtos/channel.response';
export declare class CreateChannelUseCase extends BaseUseCase<CreateChannelCommand, ChannelResponse> {
    private readonly channelRepository;
    constructor(channelRepository: IChannelRepository);
    execute(command: CreateChannelCommand): Promise<ChannelResponse>;
}
