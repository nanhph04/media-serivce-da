import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  ApiCreatedSuccessResponse,
  ApiSuccessResponse,
} from '@shared/presentation/decorators/api-success-response.decorator';
import { SkipInternalGatewayGuard } from '@shared/presentation/decorators/skip-internal-gateway.decorator';
import { CurrentUserId } from '@shared/presentation/decorators/user-id.decorator';
import { CurrentUserRole } from '@shared/presentation/decorators/user-role.decorator';
import {
  ApiResponse,
  apiResponseContract,
} from '@shared/presentation/dto/api-response.dto';
import { AdminRoleGuard } from '@shared/presentation/guards/admin-role.guard';
import { InternalGatewayGuard } from '@shared/presentation/guards/internal-gateway.guard';
import { CreateTagUseCase } from '../../application/use-cases/create-tag.use-case';
import { GetAllTagsUseCase } from '../../application/use-cases/get-all-tags.use-case';
import { GetTagsUseCase } from '../../application/use-cases/get-tags.use-case';
import { UpdateTagUseCase } from '../../application/use-cases/update-tag.use-case';
import { CreateTagRequestDto } from '../dtos/create-tag.request';
import { TagResponseDto } from '../dtos/tag.response';
import { UpdateTagRequestDto } from '../dtos/update-tag.request';
import { toTagResponseDto } from '../mappers/tag-response.mapper';

@ApiTags('tags')
@UseGuards(InternalGatewayGuard)
@Controller()
export class TagController {
  constructor(
    private readonly createTagUseCase: CreateTagUseCase,
    private readonly getAllTagsUseCase: GetAllTagsUseCase,
    private readonly getTagsUseCase: GetTagsUseCase,
    private readonly updateTagUseCase: UpdateTagUseCase,
  ) {}

  @Get('tags')
  @SkipInternalGatewayGuard()
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiSuccessResponse(TagResponseDto, { isArray: true })
  async getTags(
    @Query('q') q?: string,
  ): Promise<ApiResponse<TagResponseDto[]>> {
    const tags = await this.getTagsUseCase.execute({ q });
    return apiResponseContract(tags.map(toTagResponseDto));
  }

  @Get('admin/tags')
  @UseGuards(AdminRoleGuard)
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiQuery({ name: 'q', required: false, type: String })
  @ApiSuccessResponse(TagResponseDto, { isArray: true })
  async getAllTagsForAdmin(
    @CurrentUserId() _userId: string,
    @CurrentUserRole() _role: string | undefined,
    @Query('q') q?: string,
  ): Promise<ApiResponse<TagResponseDto[]>> {
    const tags = await this.getAllTagsUseCase.execute({ q });
    return apiResponseContract(tags.map(toTagResponseDto));
  }

  @Post('admin/tags')
  @UseGuards(AdminRoleGuard)
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiCreatedSuccessResponse(TagResponseDto)
  async createTag(
    @CurrentUserId() _userId: string,
    @CurrentUserRole() _role: string | undefined,
    @Body() dto: CreateTagRequestDto,
  ): Promise<ApiResponse<TagResponseDto>> {
    const tag = await this.createTagUseCase.execute({ name: dto.name });
    return apiResponseContract(toTagResponseDto(tag));
  }

  @Patch('admin/tags/:id')
  @UseGuards(AdminRoleGuard)
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(TagResponseDto)
  async updateTag(
    @CurrentUserId() _userId: string,
    @CurrentUserRole() _role: string | undefined,
    @Param('id') tagId: string,
    @Body() dto: UpdateTagRequestDto,
  ): Promise<ApiResponse<TagResponseDto>> {
    const tag = await this.updateTagUseCase.execute({
      tagId,
      name: dto.name,
      status: dto.status,
    });

    return apiResponseContract(toTagResponseDto(tag));
  }

  @Delete('admin/tags/:id')
  @UseGuards(AdminRoleGuard)
  @ApiHeader({ name: 'x-user-id', required: true })
  @ApiHeader({ name: 'x-user-role', required: true })
  @ApiHeader({ name: 'x-internal-secret', required: true })
  @ApiSuccessResponse(TagResponseDto)
  async deleteTag(
    @CurrentUserId() _userId: string,
    @CurrentUserRole() _role: string | undefined,
    @Param('id') tagId: string,
  ): Promise<ApiResponse<TagResponseDto>> {
    const tag = await this.updateTagUseCase.execute({
      tagId,
      status: 'inactive',
    });

    return apiResponseContract(toTagResponseDto(tag));
  }
}
