import { Injectable } from '@nestjs/common';
import { ConfigService } from '@shared/infrastructure/config/config.service';
import { LoggerService } from '@shared/infrastructure/logger/logger.service';
import {
  type IVideoWorkerHealthChecker,
  type VideoWorkerPipeline,
} from '../../application/interfaces/video-worker-health-checker.interface';

const HEALTH_CHECK_TIMEOUT_MS = 3000;

@Injectable()
export class VideoWorkerHealthCheckerService implements IVideoWorkerHealthChecker {
  constructor(
    private readonly configService: ConfigService,
    private readonly loggerService: LoggerService,
  ) {
    this.loggerService.setContext(VideoWorkerHealthCheckerService.name);
  }

  async isHealthy(pipeline: VideoWorkerPipeline): Promise<boolean> {
    const url =
      pipeline === 'moderation'
        ? this.configService.getModerationServiceHealthUrl()
        : this.configService.getMediaProcessingServiceHealthUrl();
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_TIMEOUT_MS,
    );

    try {
      const response = await fetch(url, { signal: controller.signal });
      return response.ok;
    } catch (error: unknown) {
      this.loggerService.logWarn('Video worker health check failed', {
        pipeline,
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
}
