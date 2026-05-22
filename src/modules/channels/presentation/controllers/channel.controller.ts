import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiHeader, ApiTags } from '@nestjs/swagger';
import { ApiCreatedSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentRequestId } from '@shared/presentation/decorators/request-id.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { CreateChannelUseCase } from '../../application/use-cases/create-channel.use-case';
import { GetCurrentChannelUseCase } from '../../application/use-cases/get-current-channel.use-case';
import { GetChannelDetailUseCase } from '../../application/use-cases/get-channel-detail.use-case';
import { GetMembershipStatusUseCase } from '../../application/use-cases/get-membership-status.use-case';
import { RequestChannelMembershipReviewUseCase } from '../../application/use-cases/request-channel-membership-review.use-case';
import { UpdateChannelUseCase } from '../../application/use-cases/update-channel.use-case';
import { UploadChannelImageUseCase } from '../../application/use-cases/upload-channel-image.use-case';
import type { UploadChannelImageFile } from '../../application/dtos/upload-channel-image.command';
import { CreateChannelRequestDto } from '../dtos/create-channel.request';
import { UpdateChannelRequestDto } from '../dtos/update-channel.request';
import { ChannelResponseDto } from '../dtos/channel.response';
import { CurrentChannelResponseDto } from '../dtos/current-channel.response';
import {
  ChannelDetailResponseDto,
  ChannelMembershipStatusResponseDto,
} from '../dtos/channel-detail.response';
import {
  toChannelDetailResponseDto,
  toCurrentChannelResponseDto,
  toChannelMembershipStatusResponseDto,
  toChannelResponseDto,
} from '../mappers/channel-response.mapper';

interface MultipartImageFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

@ApiTags('channels')
@ApiHeader({ name: 'x-user-id', required: true })
@UseGuards(InternalGatewayGuard)
@Controller()
export class ChannelController {
  constructor(
    private readonly createChannelUseCase: CreateChannelUseCase,
    private readonly updateChannelUseCase: UpdateChannelUseCase,
    private readonly getCurrentChannelUseCase: GetCurrentChannelUseCase,
    private readonly getChannelDetailUseCase: GetChannelDetailUseCase,
    private readonly getMembershipStatusUseCase: GetMembershipStatusUseCase,
    private readonly requestChannelMembershipReviewUseCase: RequestChannelMembershipReviewUseCase,
    private readonly uploadChannelImageUseCase: UploadChannelImageUseCase,
  ) {}

  @Post('me/channel')
  @ApiCreatedSuccessResponse(ChannelResponseDto)
  async createChannel(
    @CurrentUserId() userId: string,
    @CurrentRequestId() traceId: string,
    @Body() dto: CreateChannelRequestDto,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    const channel = await this.createChannelUseCase.execute({
      userId,
      traceId,
      name: dto.name,
      bio: dto.bio,
    });
    return apiResponseContract(toChannelResponseDto(channel));
  }

  @Patch('me/channel')
  @ApiSuccessResponse(ChannelResponseDto)
  async updateChannel(
    @CurrentUserId() userId: string,
    @Body() dto: UpdateChannelRequestDto,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    const currentChannel = await this.getCurrentChannelUseCase.execute({
      userId,
    });

    const channel = await this.updateChannelUseCase.execute({
      channelId: currentChannel.channelId,
      userId,
      name: dto.name,
      bio: dto.bio,
      avatarUrl: dto.avatarUrl,
      bannerUrl: dto.bannerUrl,
    });
    return apiResponseContract(toChannelResponseDto(channel));
  }

  @Post('me/channel/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiSuccessResponse(ChannelResponseDto)
  async uploadAvatar(
    @CurrentUserId() userId: string,
    @UploadedFile() file: MultipartImageFile | undefined,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    const channel = await this.uploadChannelImageUseCase.execute({
      userId,
      imageType: 'avatar',
      file: toUploadChannelImageFile(file),
    });

    return apiResponseContract(toChannelResponseDto(channel));
  }

  @Post('me/channel/banner')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiSuccessResponse(ChannelResponseDto)
  async uploadBanner(
    @CurrentUserId() userId: string,
    @UploadedFile() file: MultipartImageFile | undefined,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    const channel = await this.uploadChannelImageUseCase.execute({
      userId,
      imageType: 'banner',
      file: toUploadChannelImageFile(file),
    });

    return apiResponseContract(toChannelResponseDto(channel));
  }

  @Get('me/channel')
  @ApiSuccessResponse(CurrentChannelResponseDto)
  async getCurrentChannel(
    @CurrentUserId() userId: string,
  ): Promise<ApiResponse<CurrentChannelResponseDto>> {
    const result = await this.getCurrentChannelUseCase.execute({ userId });
    return apiResponseContract(toCurrentChannelResponseDto(result));
  }

  @Get('channels/:id')
  @SkipInternalGatewayGuard()
  @ApiSuccessResponse(ChannelDetailResponseDto)
  async getChannelDetail(
    @Param('id') channelId: string,
  ): Promise<ApiResponse<ChannelDetailResponseDto>> {
    const result = await this.getChannelDetailUseCase.execute({ channelId });
    return apiResponseContract(toChannelDetailResponseDto(result));
  }

  @Get('channels/:id/membership-status')
  @ApiSuccessResponse(ChannelMembershipStatusResponseDto)
  async getMembershipStatus(
    @CurrentUserId() userId: string,
    @Param('id') channelId: string,
  ): Promise<ApiResponse<ChannelMembershipStatusResponseDto>> {
    const status = await this.getMembershipStatusUseCase.execute({
      channelId,
      userId,
    });
    return apiResponseContract(toChannelMembershipStatusResponseDto(status));
  }

  @Post('channels/:id/membership-review-requests')
  @ApiSuccessResponse(ChannelResponseDto)
  async requestMembershipReview(
    @CurrentUserId() userId: string,
    @Param('id') channelId: string,
  ): Promise<ApiResponse<ChannelResponseDto>> {
    const channel = await this.requestChannelMembershipReviewUseCase.execute({
      channelId,
      userId,
    });

    return apiResponseContract(toChannelResponseDto(channel));
  }
}

function toUploadChannelImageFile(
  file: MultipartImageFile | undefined,
): UploadChannelImageFile | undefined {
  if (!file) {
    return undefined;
  }

  return {
    buffer: file.buffer,
    contentType: file.mimetype,
    originalName: file.originalname,
    sizeBytes: file.size,
  };
}
