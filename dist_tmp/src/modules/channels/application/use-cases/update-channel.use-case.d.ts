import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { UpdateChannelCommand } from '../dtos/update-channel.command';
import { ChannelResponse } from '../dtos/channel.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
export declare class UpdateChannelUseCase extends BaseUseCase<UpdateChannelCommand, ChannelResponse> {
    private readonly channelRepository;
    constructor(channelRepository: IChannelRepository);
    execute(command: UpdateChannelCommand): Promise<ChannelResponse>;
}
