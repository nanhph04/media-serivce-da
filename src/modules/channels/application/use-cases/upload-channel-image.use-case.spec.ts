import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@shared/domain/exceptions/domain.exception';
import {
  ChannelEntity,
  ChannelStatus,
} from '../../domain/entities/channel.entity';
import { UploadChannelImageUseCase } from './upload-channel-image.use-case';

describe('UploadChannelImageUseCase', () => {
  const channelRepository = {
    findByUserId: jest.fn(),
    update: jest.fn(),
  };
  const objectStorageService = {
    uploadObject: jest.fn(),
    createObjectUrl: jest.fn(),
    deleteObject: jest.fn(),
    deleteObjectByUrl: jest.fn(),
  };

  const useCase = new UploadChannelImageUseCase(
    channelRepository as never,
    objectStorageService as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    channelRepository.findByUserId.mockResolvedValue(buildChannel());
    channelRepository.update.mockResolvedValue(undefined);
    objectStorageService.uploadObject.mockResolvedValue(
      'http://localhost:9000/media-public/channels/channel-1/avatar/image.jpg',
    );
    objectStorageService.createObjectUrl.mockImplementation(
      (_bucket: string, objectKey: string) =>
        `http://localhost:9000/media-public/${objectKey}`,
    );
    objectStorageService.deleteObject.mockResolvedValue(undefined);
    objectStorageService.deleteObjectByUrl.mockResolvedValue(true);
  });

  it('uploads an avatar to public MinIO bucket and stores the object key plus runtime URL', async () => {
    const result = await useCase.execute({
      userId: 'user-1',
      imageType: 'avatar',
      file: buildFile(),
    });

    expect(objectStorageService.uploadObject).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: 'public',
        contentType: 'image/jpeg',
        sizeBytes: 1024,
      }),
    );
    expect(channelRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: expect.stringContaining(
          'http://localhost:9000/media-public/channels/channel-1/avatar/',
        ),
        avatarObjectKey: expect.stringContaining('channels/channel-1/avatar/'),
      }),
    );
    expect(result.avatarUrl).toContain(
      'http://localhost:9000/media-public/channels/channel-1/avatar/',
    );
    expect(objectStorageService.deleteObjectByUrl).not.toHaveBeenCalled();
  });

  it('uploads a banner and stores the public URL without creating a presigned URL', async () => {
    objectStorageService.uploadObject.mockResolvedValue(
      'http://localhost:9000/media-public/channels/channel-1/banner/image.webp',
    );

    const result = await useCase.execute({
      userId: 'user-1',
      imageType: 'banner',
      file: buildFile({ contentType: 'image/webp' }),
    });

    expect(objectStorageService.uploadObject).toHaveBeenCalledWith(
      expect.objectContaining({
        bucket: 'public',
        objectKey: expect.stringContaining('/banner/'),
        contentType: 'image/webp',
      }),
    );
    expect(result.bannerUrl).toContain(
      'http://localhost:9000/media-public/channels/channel-1/banner/',
    );
  });

  it('deletes the previous avatar after storing the new avatar URL', async () => {
    channelRepository.findByUserId.mockResolvedValue(
      buildChannel({
        avatarUrl:
          'http://localhost:9000/media-public/channels/channel-1/avatar/old.jpg',
      }),
    );

    await useCase.execute({
      userId: 'user-1',
      imageType: 'avatar',
      file: buildFile(),
    });

    expect(channelRepository.update).toHaveBeenCalled();
    expect(objectStorageService.deleteObjectByUrl).toHaveBeenCalledWith(
      'public',
      'http://localhost:9000/media-public/channels/channel-1/avatar/old.jpg',
    );
    expect(channelRepository.update.mock.invocationCallOrder[0]).toBeLessThan(
      objectStorageService.deleteObjectByUrl.mock.invocationCallOrder[0],
    );
  });

  it('deletes the previous banner by object key when available', async () => {
    channelRepository.findByUserId.mockResolvedValue(
      buildChannel({
        bannerUrl:
          'http://localhost:9000/media-public/channels/channel-1/banner/old.webp',
        bannerObjectKey: 'channels/channel-1/banner/old.webp',
      }),
    );

    await useCase.execute({
      userId: 'user-1',
      imageType: 'banner',
      file: buildFile({ contentType: 'image/webp' }),
    });

    expect(objectStorageService.deleteObject).toHaveBeenCalledWith(
      'public',
      'channels/channel-1/banner/old.webp',
    );
    expect(objectStorageService.deleteObjectByUrl).not.toHaveBeenCalled();
  });

  it('keeps the upload successful when deleting the previous image fails', async () => {
    channelRepository.findByUserId.mockResolvedValue(
      buildChannel({
        avatarUrl:
          'http://localhost:9000/media-public/channels/channel-1/avatar/old.jpg',
      }),
    );
    objectStorageService.deleteObjectByUrl.mockRejectedValue(
      new Error('delete failed'),
    );

    await expect(
      useCase.execute({
        userId: 'user-1',
        imageType: 'avatar',
        file: buildFile(),
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        avatarUrl: expect.stringContaining(
          'http://localhost:9000/media-public/channels/channel-1/avatar/',
        ),
      }),
    );
  });

  it('rejects missing files', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        imageType: 'avatar',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unsupported content types', async () => {
    await expect(
      useCase.execute({
        userId: 'user-1',
        imageType: 'avatar',
        file: buildFile({ contentType: 'image/gif' }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects missing channels', async () => {
    channelRepository.findByUserId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-1',
        imageType: 'avatar',
        file: buildFile(),
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects inactive channels', async () => {
    channelRepository.findByUserId.mockResolvedValue(
      buildChannel({ status: ChannelStatus.INACTIVE }),
    );

    await expect(
      useCase.execute({
        userId: 'user-1',
        imageType: 'avatar',
        file: buildFile(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

function buildFile(
  overrides: Partial<{ contentType: string; sizeBytes: number }> = {},
) {
  return {
    buffer: Buffer.from('image'),
    contentType: overrides.contentType ?? 'image/jpeg',
    originalName: 'image.jpg',
    sizeBytes: overrides.sizeBytes ?? 1024,
  };
}

function buildChannel(
  overrides: Partial<{
    status: ChannelStatus;
    avatarUrl: string;
    bannerUrl: string;
    avatarObjectKey: string | null;
    bannerObjectKey: string | null;
  }> = {},
): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'user-1',
    name: 'Creator Channel',
    bio: 'Channel bio',
    avatarUrl: overrides.avatarUrl ?? '',
    bannerUrl: overrides.bannerUrl ?? '',
    avatarObjectKey: overrides.avatarObjectKey ?? null,
    bannerObjectKey: overrides.bannerObjectKey ?? null,
    status: overrides.status ?? ChannelStatus.ACTIVE,
    isEligibleForMembership: false,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
