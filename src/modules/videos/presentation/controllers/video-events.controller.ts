import { Controller, Sse, UseGuards, type MessageEvent } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { VideoStatusSseService } from '../../infrastructure/events/video-status-sse.service';

@ApiTags('video-events')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller('videos/events')
export class VideoEventsController {
  constructor(private readonly videoStatusSseService: VideoStatusSseService) {}

  @Sse('stream')
  @ApiOperation({
    summary: 'Stream current user video processing status changes using SSE',
  })
  streamVideoEvents(
    @CurrentUserId() userId: string,
  ): Observable<MessageEvent> {
    return this.videoStatusSseService.streamForUser(userId);
  }
}
