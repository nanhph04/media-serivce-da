import { RenewVideoUploadSessionUseCase } from './renew-video-upload-session.use-case';

describe('RenewVideoUploadSessionUseCase', () => {
  const uploadSessionRepository = {
    renewExpiry: jest.fn(),
  };
  const uploadSessionGuardService = {
    getActiveOwnedDraftSession: jest.fn(),
  };
  const useCase = new RenewVideoUploadSessionUseCase(
    uploadSessionRepository as never,
    uploadSessionGuardService as never,
  );

  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renews an active upload session expiry without changing upload id', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
    uploadSessionGuardService.getActiveOwnedDraftSession.mockResolvedValue({
      id: 'session-1',
      videoId: 'video-1',
      uploadId: 'upload-1',
    });
    uploadSessionRepository.renewExpiry.mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId: 'owner-1',
      videoId: 'video-1',
      uploadId: 'upload-1',
    });

    expect(uploadSessionRepository.renewExpiry).toHaveBeenCalledWith(
      'session-1',
      new Date('2026-01-02T10:00:00.000Z'),
    );
    expect(result).toEqual({
      videoId: 'video-1',
      uploadId: 'upload-1',
      expiresAt: '2026-01-02T10:00:00.000Z',
    });
  });
});
