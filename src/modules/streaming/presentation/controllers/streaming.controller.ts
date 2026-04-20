import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import type { Response } from 'express';
import { StreamingApplicationService } from '../../application/streaming.application.service';

@ApiTags('streaming')
@SkipInternalGatewayGuard()
@UseGuards(InternalGatewayGuard)
@Controller('stream')
export class StreamingController {
  constructor(
    private readonly streamingApplicationService: StreamingApplicationService,
  ) {}

  @Get(':videoId/master.m3u8')
  @ApiQuery({ name: 'token', required: true })
  async getMasterPlaylist(
    @Param('videoId') videoId: string,
    @Query('token') token: string,
    @Res() response: Response,
  ): Promise<void> {
    const playlist =
      await this.streamingApplicationService.streamMasterPlaylist(
        videoId,
        token,
      );
    response.type('application/vnd.apple.mpegurl').send(playlist);
  }

  @Get(':videoId/segments/:segmentName')
  @ApiQuery({ name: 'token', required: true })
  async getSegment(
    @Param('videoId') videoId: string,
    @Param('segmentName') segmentName: string,
    @Query('token') token: string,
    @Res() response: Response,
  ): Promise<void> {
    await this.streamingApplicationService.pipeSegment(
      {
        videoId,
        segmentName: decodeURIComponent(segmentName),
        token,
      },
      response,
    );
  }
}
