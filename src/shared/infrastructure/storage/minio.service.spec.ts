import { PassThrough } from 'stream';
import { Client } from 'minio';
import { MinioService } from './minio.service';

jest.mock('minio', () => {
  const clientMock = jest.fn();

  return {
    Client: clientMock,
  };
});

describe('MinioService', () => {
  const getObject = jest.fn();
  const bucketExists = jest.fn();
  const makeBucket = jest.fn();
  const presignedPutObject = jest.fn();
  const statObject = jest.fn();
  const copyObject = jest.fn();
  const removeObject = jest.fn();
  const logger = {
    setContext: jest.fn(),
    logInfo: jest.fn(),
  };
  const requiredConfig = {
    MINIO_RAW_BUCKET: 'media-raw',
    MINIO_PROCESSED_BUCKET: 'media-processed',
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: 9000,
    MINIO_USE_SSL: false,
    MINIO_ACCESS_KEY: 'minio',
    MINIO_SECRET_KEY: 'minio123',
  };

  let service: MinioService;
  let configService: {
    getOrThrow: jest.Mock;
    getNumberOrThrow: jest.Mock;
    getBooleanOrThrow: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Client as jest.Mock).mockImplementation(() => ({
      getObject,
      bucketExists,
      makeBucket,
      presignedPutObject,
      statObject,
      copyObject,
      removeObject,
    }));
    bucketExists.mockResolvedValue(true);
    configService = {
      getOrThrow: jest.fn((key: keyof typeof requiredConfig) => {
        if (!(key in requiredConfig)) {
          throw new Error(`Config key "${key}" is not defined`);
        }

        return requiredConfig[key];
      }),
      getNumberOrThrow: jest.fn((key: keyof typeof requiredConfig) => {
        const value = requiredConfig[key];
        if (typeof value !== 'number') {
          throw new Error(`Config key "${key}" must be a valid number`);
        }

        return value;
      }),
      getBooleanOrThrow: jest.fn((key: keyof typeof requiredConfig) => {
        const value = requiredConfig[key];
        if (typeof value !== 'boolean') {
          throw new Error(`Config key "${key}" must be "true" or "false"`);
        }

        return value;
      }),
    };
    service = new MinioService(configService as never, logger as never);
  });

  it('maps logical raw bucket to configured bucket for upload URLs', async () => {
    presignedPutObject.mockResolvedValue('presigned-url');

    await service.createUploadUrl('raw', 'video/raw.mp4');

    expect(presignedPutObject).toHaveBeenCalledWith(
      'media-raw',
      'video/raw.mp4',
      900,
    );
  });

  it('maps logical processed bucket to configured bucket when reading a stream', async () => {
    const stream = new PassThrough();
    getObject.mockResolvedValue(stream);

    await service.getObjectStream('processed', 'video/master.m3u8');

    expect(getObject).toHaveBeenCalledWith(
      'media-processed',
      'video/master.m3u8',
    );
  });

  it('reads text content from the configured processed bucket', async () => {
    const stream = new PassThrough();
    getObject.mockResolvedValue(stream);

    const textPromise = service.getObjectText('processed', 'video/master.m3u8');
    stream.end('#EXTM3U');

    await expect(textPromise).resolves.toBe('#EXTM3U');
    expect(getObject).toHaveBeenCalledWith(
      'media-processed',
      'video/master.m3u8',
    );
  });

  it('maps logical processed bucket to configured bucket for metadata checks', async () => {
    statObject.mockResolvedValue({ size: 1024 });

    await service.getObjectMetadata('processed', 'video/master.m3u8');

    expect(statObject).toHaveBeenCalledWith(
      'media-processed',
      'video/master.m3u8',
    );
  });

  it('copies objects within the configured logical bucket', async () => {
    copyObject.mockResolvedValue(undefined);

    await service.copyObject('raw', 'draft/video.mp4', 'confirmed/video.mp4');

    expect(copyObject).toHaveBeenCalledWith(
      'media-raw',
      'confirmed/video.mp4',
      '/media-raw/draft/video.mp4',
    );
  });

  it('deletes objects from the configured logical bucket', async () => {
    removeObject.mockResolvedValue(undefined);

    await service.deleteObject('raw', 'draft/video.mp4');

    expect(removeObject).toHaveBeenCalledWith('media-raw', 'draft/video.mp4');
  });

  it('fails fast when a required MinIO bucket config is missing', () => {
    configService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'MINIO_RAW_BUCKET') {
        throw new Error('Config key "MINIO_RAW_BUCKET" is not defined');
      }

      return requiredConfig[key as keyof typeof requiredConfig];
    });

    expect(
      () => new MinioService(configService as never, logger as never),
    ).toThrow('Config key "MINIO_RAW_BUCKET" is not defined');
  });

  it('fails fast when the MinIO port config is invalid', () => {
    configService.getNumberOrThrow.mockImplementation((key: string) => {
      if (key === 'MINIO_PORT') {
        throw new Error('Config key "MINIO_PORT" must be a valid number');
      }

      return 9000;
    });

    expect(
      () => new MinioService(configService as never, logger as never),
    ).toThrow('Config key "MINIO_PORT" must be a valid number');
  });

  it('fails fast when the MinIO SSL config is invalid', () => {
    configService.getBooleanOrThrow.mockImplementation((key: string) => {
      if (key === 'MINIO_USE_SSL') {
        throw new Error('Config key "MINIO_USE_SSL" must be "true" or "false"');
      }

      return false;
    });

    expect(
      () => new MinioService(configService as never, logger as never),
    ).toThrow('Config key "MINIO_USE_SSL" must be "true" or "false"');
  });
});
