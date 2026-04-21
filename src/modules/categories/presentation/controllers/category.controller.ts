import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { ForbiddenException } from '@shared/domain/exceptions/domain.exception';
import { ApiCreatedSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { ApiSuccessResponse } from '@shared/presentation/decorators/api-success-response.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { CurrentUserRole } from '@shared/presentation/decorators/user-role.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { CreateCategoryUseCase } from '../../application/use-cases/create-category.use-case';
import { GetAllCategoriesUseCase } from '../../application/use-cases/get-all-categories.use-case';
import { GetCategoriesUseCase } from '../../application/use-cases/get-categories.use-case';
import { UpdateCategoryUseCase } from '../../application/use-cases/update-category.use-case';
import { CategoryResponseDto } from '../dtos/category.response';
import { CreateCategoryRequestDto } from '../dtos/create-category.request';
import { UpdateCategoryRequestDto } from '../dtos/update-category.request';
import { toCategoryResponseDto } from '../mappers/category-response.mapper';

@ApiTags('categories')
@UseGuards(InternalGatewayGuard)
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly getAllCategoriesUseCase: GetAllCategoriesUseCase,
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
  ) {}

  @Get()
  @SkipInternalGatewayGuard()
  @ApiSuccessResponse(CategoryResponseDto, { isArray: true })
  async getCategories(): Promise<ApiResponse<CategoryResponseDto[]>> {
    const categories = await this.getCategoriesUseCase.execute();
    return apiResponseContract(categories.map(toCategoryResponseDto));
  }

  @Get('admin/all')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(CategoryResponseDto, { isArray: true })
  async getAllCategoriesForAdmin(
    @CurrentUserId() _userId: string,
    @CurrentUserRole() role: string | undefined,
  ): Promise<ApiResponse<CategoryResponseDto[]>> {
    this.assertAdmin(role);

    const categories = await this.getAllCategoriesUseCase.execute();
    return apiResponseContract(categories.map(toCategoryResponseDto));
  }

  @Post()
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiCreatedSuccessResponse(CategoryResponseDto)
  async createCategory(
    @CurrentUserId() _userId: string,
    @CurrentUserRole() role: string | undefined,
    @Body() dto: CreateCategoryRequestDto,
  ): Promise<ApiResponse<CategoryResponseDto>> {
    this.assertAdmin(role);

    const category = await this.createCategoryUseCase.execute({
      name: dto.name,
      description: dto.description,
    });

    return apiResponseContract(toCategoryResponseDto(category));
  }

  @Patch(':id')
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(CategoryResponseDto)
  async updateCategory(
    @CurrentUserId() _userId: string,
    @CurrentUserRole() role: string | undefined,
    @Param('id') categoryId: string,
    @Body() dto: UpdateCategoryRequestDto,
  ): Promise<ApiResponse<CategoryResponseDto>> {
    this.assertAdmin(role);

    const category = await this.updateCategoryUseCase.execute({
      categoryId,
      name: dto.name,
      description: dto.description,
    });

    return apiResponseContract(toCategoryResponseDto(category));
  }

  private assertAdmin(role: string | undefined): void {
    if (role !== 'admin') {
      throw new ForbiddenException('Admin role is required');
    }
  }
}
