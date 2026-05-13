import { BadRequestException } from '@shared/domain/exceptions/domain.exception';
import {
  Category,
  CategoryStatus,
} from '../../../categories/domain/entities/category.entity';
import {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import { InitVideoUploadUseCase } from './init-video-upload.use-case';
import { Tag, TagStatus } from '../../../tags/domain/entities/tag.entity';

describe('InitVideoUploadUseCase', () => {
  const videoRepository = {
    save: jest.fn(),
  };
  const categoryRepository = {
    findById: jest.fn(),
  };
  const tagRepository = {
    findByIds: jest.fn(),
  };
  const channelAccessService = {
    getOwnedActiveChannelId: jest.fn(),
  };
  const objectStorageService = {
    getBucketName: jest.fn(),
    createUploadUrl: jest.fn(),
  };

  const useCase = new InitVideoUploadUseCase(
    videoRepository as never,
    categoryRepository as never,
    channelAccessService as never,
    objectStorageService as never,
    tagRepository as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    channelAccessService.getOwnedActiveChannelId.mockResolvedValue('channel-1');
    objectStorageService.getBucketName.mockReturnValue('raw-videos');
    objectStorageService.createUploadUrl.mockResolvedValue(
      'https://upload.example.com',
    );
  });

  it('succeeds with one valid category id and active tags', async () => {
    categoryRepository.findById.mockResolvedValue(buildCategory());
    tagRepository.findByIds.mockResolvedValue([buildTag()]);

    const result = await useCase.execute(
      buildCommand({ categoryId: 'category-1', tagIds: ['tag-1'] }),
    );

    expect(categoryRepository.findById).toHaveBeenCalledWith('category-1');
    expect(tagRepository.findByIds).toHaveBeenCalledWith(['tag-1']);
    expect(videoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        status: VideoStatus.DRAFT,
      }),
    );
    expect(result.bucket).toBe('raw-videos');
  });

  it('trims category id before lookup', async () => {
    categoryRepository.findById.mockResolvedValue(buildCategory());
    tagRepository.findByIds.mockResolvedValue([]);

    await useCase.execute(buildCommand({ categoryId: ' category-1 ' }));

    expect(categoryRepository.findById).toHaveBeenCalledWith('category-1');
  });

  it('rejects blank category id', async () => {
    await expect(
      useCase.execute(buildCommand({ categoryId: '   ' })),
    ).rejects.toThrow(
      new BadRequestException('Exactly one category is required'),
    );
    expect(categoryRepository.findById).not.toHaveBeenCalled();
  });

  it('rejects when category does not exist', async () => {
    categoryRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute(buildCommand({ categoryId: 'missing' })),
    ).rejects.toThrow(new BadRequestException('Category is invalid'));
  });

  it('rejects inactive categories', async () => {
    categoryRepository.findById.mockResolvedValue(
      buildCategory({ status: CategoryStatus.INACTIVE }),
    );

    await expect(
      useCase.execute(buildCommand({ categoryId: 'category-1' })),
    ).rejects.toThrow(new BadRequestException('Category is invalid'));
  });

  it('rejects duplicate tag ids', async () => {
    categoryRepository.findById.mockResolvedValue(buildCategory());

    await expect(
      useCase.execute(buildCommand({ tagIds: ['tag-1', ' tag-1 '] })),
    ).rejects.toThrow(new BadRequestException('Duplicate tags are not allowed'));
    expect(tagRepository.findByIds).not.toHaveBeenCalled();
  });

  it('rejects invalid or inactive tags', async () => {
    categoryRepository.findById.mockResolvedValue(buildCategory());
    tagRepository.findByIds.mockResolvedValue([
      buildTag({ status: TagStatus.INACTIVE }),
    ]);

    await expect(
      useCase.execute(buildCommand({ tagIds: ['tag-1'] })),
    ).rejects.toThrow(new BadRequestException('One or more tags are invalid'));
  });
});

function buildCommand(
  overrides: Partial<{
    categoryId: string;
    tagIds: string[];
  }> = {},
): {
  userId: string;
  title: string;
  description: string;
  categoryId: string;
  tagIds: string[];
  visibility: VideoVisibility;
  price: number;
  requiredTierLevel: number | null;
} {
  return {
    userId: 'owner-1',
    title: 'Video title',
    description: 'Description',
    categoryId: overrides.categoryId ?? 'category-1',
    tagIds: overrides.tagIds ?? [],
    visibility: VideoVisibility.PUBLIC,
    price: 0,
    requiredTierLevel: null,
  };
}

function buildCategory(
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    status: CategoryStatus;
  }> = {},
): Category {
  return new Category({
    id: overrides.id ?? 'category-1',
    name: overrides.name ?? 'Music',
    slug: overrides.slug ?? 'music',
    description: null,
    status: overrides.status ?? CategoryStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}

function buildTag(
  overrides: Partial<{
    id: string;
    name: string;
    slug: string;
    status: TagStatus;
  }> = {},
): Tag {
  return new Tag({
    id: overrides.id ?? 'tag-1',
    name: overrides.name ?? 'Action',
    slug: overrides.slug ?? 'action',
    status: overrides.status ?? TagStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  });
}
