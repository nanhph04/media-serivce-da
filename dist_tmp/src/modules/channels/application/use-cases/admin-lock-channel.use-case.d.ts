import { IChannelRepository } from '../../domain/repositories/channel.repository';
import { LockChannelCommand } from '../dtos/lock-channel.command';
import { ChannelResponse } from '../dtos/channel.response';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
export declare class AdminLockChannelUseCase extends BaseUseCase<LockChannelCommand, ChannelResponse> {
    private readonly channelRepository;
    constructor(channelRepository: IChannelRepository);
    execute(command: LockChannelCommand): Promise<ChannelResponse>;
}
