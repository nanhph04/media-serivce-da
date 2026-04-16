import { CacheService } from '@shared/infrastructure/cache/cache.service';
import { KafkaService } from '@shared/infrastructure/messaging/kafka.service';
import { ConfigService } from '@shared/infrastructure/config/config.service';
export declare class RecordVideoViewUseCase {
    private readonly cacheService;
    private readonly kafkaService;
    private readonly configService;
    constructor(cacheService: CacheService, kafkaService: KafkaService, configService: ConfigService);
    execute(input: {
        userId: string;
        videoId: string;
    }): Promise<void>;
}
