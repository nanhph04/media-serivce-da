import {
  Controller,
  Inject,
  Sse,
  UseGuards,
  type MessageEvent,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import {
  VIDEO_STATUS_EVENT_STREAM,
  type IVideoStatusEventStream,
} from '../../application/interfaces/video-status-event-stream.interface';

@ApiTags('video-events')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller('videos/events')
export class VideoEventsController {
  constructor(
    @Inject(VIDEO_STATUS_EVENT_STREAM)
    private readonly videoStatusEventStream: IVideoStatusEventStream,
  ) {}

  @Sse('stream')
  @ApiOperation({
    summary: 'Stream current user video processing status changes using SSE',
  })
  streamVideoEvents(@CurrentUserId() userId: string): Observable<MessageEvent> {
    return this.videoStatusEventStream.streamForUser(userId);
  }
}
