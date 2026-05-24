import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import { ApiResponse } from '@shared/presentation/dto/api-response.dto';
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
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiSuccessResponse(CategoryResponseDto, { isArray: true })
  async getCategories(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ApiResponse<CategoryResponseDto[]>> {
    const categories = await this.getCategoriesUseCase.execute({
      q,
      page: parsePage(page),
      limit: parseLimit(limit),
    });
    return ApiResponse.success(
      categories.items.map(toCategoryResponseDto),
      undefined,
      categories.pagination,
    );
  }
}

function parseLimit(limit?: string): number {
  const parsed = Number(limit) || 20;
  return Math.min(Math.max(parsed, 1), 50);
}

function parsePage(page?: string): number {
  const parsed = Number(page) || 1;
  return Math.max(parsed, 1);
}
