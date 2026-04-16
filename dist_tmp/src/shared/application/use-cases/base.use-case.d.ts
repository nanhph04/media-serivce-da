import { LoggerService } from '../../infrastructure/logger/logger.service';
export declare abstract class BaseUseCase<TInput, TOutput> {
    protected readonly logger: LoggerService;
    constructor();
    abstract execute(input: TInput): Promise<TOutput>;
}
