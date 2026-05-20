import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { GetCategoriesUseCase } from '../../application/use-cases/get-categories.use-case';
import { CategoryResponseDto } from '../dtos/category.response';
import { toCategoryResponseDto } from '../mappers/category-response.mapper';

@ApiTags('categories')
@UseGuards(InternalGatewayGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly getCategoriesUseCase: GetCategoriesUseCase) {}

  @Get()
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiSuccessResponse(CategoryResponseDto, { isArray: true })
  async getCategories(
    @Query('q') q?: string,
  ): Promise<ApiResponse<CategoryResponseDto[]>> {
    const categories = await this.getCategoriesUseCase.execute({ q });
    return apiResponseContract(categories.map(toCategoryResponseDto));
  }
}
