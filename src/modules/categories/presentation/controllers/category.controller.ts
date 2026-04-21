import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ApiCreatedSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { GetCategoriesUseCase } from '../../application/use-cases/get-categories.use-case';
import { CategoryResponseDto } from '../dtos/category.response';
import { CreateCategoryRequestDto } from '../dtos/create-category.request';
import { toCategoryResponseDto } from '../mappers/category-response.mapper';

@ApiTags('categories')
@UseGuards(InternalGatewayGuard)
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
  ) {}

  @Get()
  @SkipInternalGatewayGuard()
  @ApiSuccessResponse(CategoryResponseDto, { isArray: true })
  async getCategories(): Promise<ApiResponse<CategoryResponseDto[]>> {
    const categories = await this.getCategoriesUseCase.execute();
    return apiResponseContract(categories.map(toCategoryResponseDto));
  }

  @Post()
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiCreatedSuccessResponse(CategoryResponseDto)
  async createCategory(
    @CurrentUserId() _userId: string,
    @Body() dto: CreateCategoryRequestDto,
  ): Promise<ApiResponse<CategoryResponseDto>> {
    const category = await this.createCategoryUseCase.execute({
      name: dto.name,
      description: dto.description,
    });

    return apiResponseContract(toCategoryResponseDto(category));
  }
}
