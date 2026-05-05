import { Controller, Get, Param, Query, Res, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import type { Response } from 'express';
import { GetStreamMasterPlaylistUseCase } from '../../application/use-cases/get-stream-master-playlist.use-case';
import { StreamVideoSegmentUseCase } from '../../application/use-cases/stream-video-segment.use-case';

@ApiTags('streaming')
@SkipInternalGatewayGuard()
@UseGuards(InternalGatewayGuard)
@Controller('stream')
export class StreamingController {
  constructor(
    private readonly getStreamMasterPlaylistUseCase: GetStreamMasterPlaylistUseCase,
    private readonly streamVideoSegmentUseCase: StreamVideoSegmentUseCase,
  ) {}

  @Get(':videoId/master.m3u8')
  @ApiQuery({ name: 'token', required: true })
  async getMasterPlaylist(
    @Param('videoId') videoId: string,
    @Query('token') token: string,
    @Res() response: Response,
  ): Promise<void> {
    const playlist = await this.getStreamMasterPlaylistUseCase.execute({
      videoId,
      token,
    });
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
    const segment = await this.streamVideoSegmentUseCase.execute({
      videoId,
      segmentName: decodeURIComponent(segmentName),
      token,
    });

    response.setHeader('Content-Type', segment.contentType);

    if (typeof segment.body === 'string') {
      response.send(segment.body);
      return;
    }

    const stream = segment.body;

    await new Promise<void>((resolve, reject) => {
      stream.on('error', reject);
      response.on('close', resolve);
      stream.pipe(response);
    });
  }
}
