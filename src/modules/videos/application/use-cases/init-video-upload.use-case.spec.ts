import { Category, CategoryStatus } from '../../../categories/domain/entities/category.entity';
import { InitVideoUploadUseCase } from './init-video-upload.use-case';
import { VideoVisibility } from '../../domain/entities/video.entity';

describe('InitVideoUploadUseCase', () => {
  const videoRepository = {
    save: jest.fn(),
  };
  const categoryRepository = {
    findBySlugs: jest.fn(),
    findBySlug: jest.fn(),
  };
  const channelAccessService = {
    assertOwnedActiveChannel: jest.fn(),
  };
  const minioService = {
    getRawBucket: jest.fn().mockReturnValue('raw-bucket'),
    createRawUploadUrl: jest.fn().mockResolvedValue('https://upload-url'),
  };

  let useCase: InitVideoUploadUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new InitVideoUploadUseCase(
      videoRepository as never,
      categoryRepository as never,
      channelAccessService,
      minioService as never,
    );
  });

  it('maps valid category slugs into category entities', async () => {
    const music = new Category({
      id: 'cat-1',
      name: 'Music',
      slug: 'music',
      description: null,
      status: CategoryStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const sports = new Category({
      id: 'cat-2',
      name: 'Sports',
      slug: 'sports',
      description: null,
      status: CategoryStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    categoryRepository.findBySlugs.mockResolvedValue([music, sports]);

    await useCase.execute({
      userId: 'user-1',
      channelId: 'channel-1',
      title: 'Video',
      description: '',
      categories: ['music', 'sports', 'invalid'],
      visibility: VideoVisibility.PUBLIC,
      price: 0,
      requiredTierLevel: null,
    });

    const savedVideo = videoRepository.save.mock.calls[0][0];
    expect(savedVideo.category.map((category: Category) => category.slug)).toEqual([
      'music',
      'sports',
    ]);
  });

  it('falls back to Khac when no category slug matches', async () => {
    const fallback = new Category({
      id: 'cat-khac',
      name: 'Khác',
      slug: 'khac',
      description: null,
      status: CategoryStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    categoryRepository.findBySlugs.mockResolvedValue([]);
    categoryRepository.findBySlug.mockResolvedValue(fallback);

    await useCase.execute({
      userId: 'user-1',
      channelId: 'channel-1',
      title: 'Video',
      description: '',
      categories: ['unknown'],
      visibility: VideoVisibility.PUBLIC,
      price: 0,
      requiredTierLevel: null,
    });

    const savedVideo = videoRepository.save.mock.calls[0][0];
    expect(savedVideo.category.map((category: Category) => category.slug)).toEqual([
      'khac',
    ]);
  });
});
