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
  });

  it('uploads an avatar to public MinIO bucket and stores the public URL', async () => {
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
        avatarUrl:
          'http://localhost:9000/media-public/channels/channel-1/avatar/image.jpg',
      }),
    );
    expect(result.avatarUrl).toBe(
      'http://localhost:9000/media-public/channels/channel-1/avatar/image.jpg',
    );
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
    expect(result.bannerUrl).toBe(
      'http://localhost:9000/media-public/channels/channel-1/banner/image.webp',
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
  overrides: Partial<{ status: ChannelStatus }> = {},
): ChannelEntity {
  return new ChannelEntity({
    id: 'channel-1',
    userId: 'user-1',
    name: 'Creator Channel',
    bio: 'Channel bio',
    avatarUrl: '',
    bannerUrl: '',
    status: overrides.status ?? ChannelStatus.ACTIVE,
    isEligibleForMembership: false,
    isMembershipClosedByAdmin: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  });
}
