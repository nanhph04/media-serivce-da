import { LoggerService } from '../../infrastructure/logger/logger.service';

export abstract class BaseUseCase<TInput, TOutput> {
  protected readonly logger: LoggerService;

  constructor() {
    this.logger = new LoggerService();
    this.logger.setContext(this.constructor.name);
  }

  abstract execute(input: TInput): Promise<TOutput>;
}
