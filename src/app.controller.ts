import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from './shared/presentation/decorators/api-success-response.decorator';
import { SkipInternalGatewayGuard } from './shared/presentation/decorators/skip-internal-gateway.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from './shared/presentation/dto/api-response.dto';
import { AppService } from './app.service';

@ApiTags('app')
@SkipInternalGatewayGuard()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiSuccessResponse(String)
  getHello(): ApiResponse<string> {
    return apiResponseContract(this.appService.getHello());
  }
}
