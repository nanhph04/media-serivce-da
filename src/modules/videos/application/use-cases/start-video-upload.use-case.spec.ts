import { Category, CategoryStatus } from '../../../categories/domain/entities/category.entity';
import { VideoEntity, VideoVisibility } from '../../domain/entities/video.entity';
import { StartVideoUploadUseCase } from './start-video-upload.use-case';

describe('StartVideoUploadUseCase', () => {
  const videoRepository = {
    save: jest.fn(),
    deleteDraftById: jest.fn(),
  };
  const categoryRepository = {
    findById: jest.fn(),
  };
  const channelAccessService = {
    getOwnedActiveChannelId: jest.fn(),
  };
  const objectStorageService = {
    createMultipartUpload: jest.fn(),
    abortMultipartUpload: jest.fn(),
    getBucketName: jest.fn(),
    createUploadUrl: jest.fn(),
  };
  const tagRepository = {
    findByIds: jest.fn(),
  };
  const uploadSessionRepository = {
    create: jest.fn(),
  };
  const videoUploadConfig = {
    getMaxVideoUploadSizeBytes: jest.fn(),
  };

  const useCase = new StartVideoUploadUseCase(
    videoRepository as never,
    categoryRepository as never,
    channelAccessService as never,
    objectStorageService as never,
    tagRepository as never,
    uploadSessionRepository as never,
    videoUploadConfig as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    videoRepository.save.mockResolvedValue(undefined);
    videoRepository.deleteDraftById.mockResolvedValue(undefined);
    categoryRepository.findById.mockResolvedValue(buildCategory());
    channelAccessService.getOwnedActiveChannelId.mockResolvedValue('channel-1');
    objectStorageService.abortMultipartUpload.mockResolvedValue(undefined);
    objectStorageService.getBucketName.mockReturnValue('media-raw');
    objectStorageService.createUploadUrl.mockResolvedValue('https://upload.example/video.jpg');
    uploadSessionRepository.create.mockResolvedValue({ id: 'session-1' });
    videoUploadConfig.getMaxVideoUploadSizeBytes.mockReturnValue(1024 * 1024 * 1024);
  });

  it('deletes the draft video when multipart upload creation fails', async () => {
    const storageError = new Error('MinIO unavailable');
    objectStorageService.createMultipartUpload.mockRejectedValue(storageError);

    await expect(useCase.execute(buildCommand())).rejects.toThrow(storageError);

    const savedVideo = videoRepository.save.mock.calls[0][0] as VideoEntity;
    expect(videoRepository.deleteDraftById).toHaveBeenCalledWith(savedVideo.id);
    expect(uploadSessionRepository.create).not.toHaveBeenCalled();
    expect(objectStorageService.abortMultipartUpload).not.toHaveBeenCalled();
  });

  it('aborts multipart upload and deletes the draft video when session creation fails', async () => {
    const sessionError = new Error('DB session write failed');
    objectStorageService.createMultipartUpload.mockResolvedValue('upload-1');
    uploadSessionRepository.create.mockRejectedValue(sessionError);

    await expect(useCase.execute(buildCommand())).rejects.toThrow(sessionError);

    const savedVideo = videoRepository.save.mock.calls[0][0] as VideoEntity;
    expect(objectStorageService.abortMultipartUpload).toHaveBeenCalledWith({
      bucket: 'raw',
      objectKey: savedVideo.rawFileKey,
      uploadId: 'upload-1',
    });
    expect(videoRepository.deleteDraftById).toHaveBeenCalledWith(savedVideo.id);
  });
});

function buildCommand() {
  return {
    userId: 'owner-1',
    title: 'Upload title',
    description: 'Upload description',
    categoryId: 'category-1',
    tagIds: [],
    visibility: VideoVisibility.PUBLIC,
    price: 0,
    requiredTierLevel: null,
    fileName: 'video.mp4',
    fileSize: 1024,
    fileLastModified: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function buildCategory(): Category {
  return new Category({
    id: 'category-1',
    name: 'Education',
    slug: 'education',
    description: null,
    parentId: null,
    status: CategoryStatus.ACTIVE,
    displayOrder: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
