import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';

import { ApiSuccessResponse } from '../decorators/api-success-response.decorator';
import { ApiResponse, apiResponseContract } from '../dto/api-response.dto';
import { InternalServiceGuard } from '../guards/internal-service.guard';

export class InternalHealthResponseDto {
  @ApiProperty()
  service!: string;

  @ApiProperty()
  status!: string;
}

@ApiTags('internal')
@UseGuards(InternalServiceGuard)
@Controller('internal/health')
export class InternalHealthController {
  @Get()
  @ApiSuccessResponse(InternalHealthResponseDto)
  public check(): ApiResponse<InternalHealthResponseDto> {
    return apiResponseContract({
      service: 'media-service',
      status: 'ok',
    });
  }
}
