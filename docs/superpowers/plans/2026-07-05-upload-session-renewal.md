# Upload Session Renewal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow slow uploads to continue by renewing active upload sessions before expiry while still blocking genuinely expired sessions.

**Architecture:** Backend owns session expiry and exposes a small renewal endpoint that extends the existing multipart upload session without changing `uploadId`. Frontend calls renewal proactively when the session is close to expiry, then continues using the same session and existing resumable part tracking.

**Tech Stack:** NestJS, TypeScript, TypeORM, Jest, Next.js, React, browser `XMLHttpRequest`, existing `mediaService` API wrapper.

## Global Constraints

- Keep DB/session state as source of truth for upload sessions.
- Keep object storage as source of truth for multipart part validity at `completeMultipartUpload`.
- Do not create a new multipart upload when renewing; keep the same `uploadId`.
- Renewal only applies to `ACTIVE`, owned, draft upload sessions that have not already expired.
- Keep changes minimal and aligned with current Clean Architecture layering.
- Do not commit unless the user explicitly asks for a commit.

---

## File Structure

### Backend

- Modify: `src/modules/videos/domain/repositories/video-upload-session.repository.ts`
  - Add repository method for updating `expiresAt`.
- Modify: `src/modules/videos/infrastructure/persistence/video-upload-session.repository.ts`
  - Implement expiry update using TypeORM.
- Create: `src/modules/videos/application/use-cases/renew-video-upload-session.use-case.ts`
  - Validate session through `VideoUploadSessionGuardService`, calculate new expiry, persist it, return renewal response.
- Create: `src/modules/videos/application/use-cases/renew-video-upload-session.use-case.spec.ts`
  - Cover renewal success and expired-session rejection through the shared guard behavior.
- Modify: `src/modules/videos/application/services/video-upload-session-guard.service.ts`
  - Enforce `expiresAt > now` for guarded upload actions.
- Modify: `src/modules/videos/application/services/video-upload-session-guard.service.spec.ts`
  - Keep the expired active session regression test.
- Modify: `src/modules/videos/application/dtos/video-upload-session.response.ts`
  - Add `RenewVideoUploadSessionResponse`.
- Modify: `src/modules/videos/presentation/dtos/video-upload-session.response.ts`
  - Add `RenewVideoUploadSessionResponseDto` for Swagger/controller typing.
- Modify: `src/modules/videos/presentation/controllers/videos.controller.ts`
  - Add `POST /studio/videos/:videoId/uploads/:uploadId/renew`.
- Modify: `src/modules/videos/presentation/controllers/videos.controller.spec.ts`
  - Verify controller delegates renew command and returns response.
- Modify: `src/modules/videos/videos.module.ts`
  - Register `RenewVideoUploadSessionUseCase`.

### Frontend

- Modify: `E:/doan/distributed_media_system/fe/src/features/watch/services/mediaService.types.ts`
  - Add `RenewUploadSessionResponse` and optional `renewBeforeExpiryMs` to `UploadResumableParams`.
- Modify: `E:/doan/distributed_media_system/fe/src/features/watch/services/mediaService.ts`
  - Add `renewUploadSession` API wrapper and pass it into resumable uploader.
- Modify: `E:/doan/distributed_media_system/fe/src/features/watch/services/mediaService.upload.ts`
  - Track current session `expiresAt` and renew before long-running upload operations.
- Create: `E:/doan/distributed_media_system/fe/src/features/watch/services/mediaService.upload.test.ts`
  - Cover proactive renewal before part URL fetch and before final complete.

---

### Task 1: Backend Guard Enforces Expiry

**Files:**
- Modify: `src/modules/videos/application/services/video-upload-session-guard.service.ts`
- Test: `src/modules/videos/application/services/video-upload-session-guard.service.spec.ts`

**Interfaces:**
- Consumes: `VideoUploadSession.expiresAt: Date`
- Produces: `getActiveOwnedDraftSession(...)` rejects expired sessions with `ConflictException(ERROR_MESSAGES.UPLOAD_SESSION_NOT_ACTIVE)`

- [ ] **Step 1: Write the failing guard test**

Add a focused test that builds a draft video and an upload session with:

```ts
status: VideoUploadSessionStatus.ACTIVE,
expiresAt: new Date('2026-01-01T00:00:00.000Z'),
```

Assert:

```ts
await expect(
  service.getActiveOwnedDraftSession({
    userId: 'owner-1',
    videoId: 'video-1',
    uploadId: 'upload-1',
  }),
).rejects.toMatchObject({
  constructor: ConflictException,
  message: ERROR_MESSAGES.UPLOAD_SESSION_NOT_ACTIVE,
});
```

- [ ] **Step 2: Run RED test**

Run: `npm test -- video-upload-session-guard.service.spec.ts --runInBand`

Expected: FAIL because the promise resolves with the expired active session.

- [ ] **Step 3: Implement minimal guard check**

In `getActiveOwnedDraftSession`, after status check:

```ts
if (session.expiresAt.getTime() <= Date.now()) {
  throw new ConflictException(ERROR_MESSAGES.UPLOAD_SESSION_NOT_ACTIVE);
}
```

- [ ] **Step 4: Run GREEN test**

Run: `npm test -- video-upload-session-guard.service.spec.ts --runInBand`

Expected: PASS.

---

### Task 2: Backend Renewal Use Case And Repository Method

**Files:**
- Modify: `src/modules/videos/domain/repositories/video-upload-session.repository.ts`
- Modify: `src/modules/videos/infrastructure/persistence/video-upload-session.repository.ts`
- Create: `src/modules/videos/application/use-cases/renew-video-upload-session.use-case.ts`
- Create: `src/modules/videos/application/use-cases/renew-video-upload-session.use-case.spec.ts`
- Modify: `src/modules/videos/application/dtos/video-upload-session.response.ts`

**Interfaces:**
- Produces repository method:

```ts
renewExpiry(sessionId: string, expiresAt: Date): Promise<void>;
```

- Produces use case input/output:

```ts
type RenewVideoUploadSessionCommand = {
  userId: string;
  videoId: string;
  uploadId: string;
};

type RenewVideoUploadSessionResponse = {
  videoId: string;
  uploadId: string;
  expiresAt: string;
};
```

- [ ] **Step 1: Write failing use case spec**

Create `renew-video-upload-session.use-case.spec.ts` with mocks for:

```ts
const uploadSessionRepository = {
  renewExpiry: jest.fn(),
};
const uploadSessionGuardService = {
  getActiveOwnedDraftSession: jest.fn(),
};
```

Test success:

```ts
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
```

Use the existing 24-hour `MULTIPART_UPLOAD_TTL_HOURS` policy from `StartVideoUploadUseCase`. If that constant is not exported, duplicate the same local constant in the renewal use case to keep the change small.

- [ ] **Step 2: Run RED use case spec**

Run: `npm test -- renew-video-upload-session.use-case.spec.ts --runInBand`

Expected: FAIL because the use case does not exist.

- [ ] **Step 3: Add response DTO type**

In `src/modules/videos/application/dtos/video-upload-session.response.ts` add:

```ts
export interface RenewVideoUploadSessionResponse {
  videoId: string;
  uploadId: string;
  expiresAt: string;
}
```

- [ ] **Step 4: Add repository interface method**

In `IVideoUploadSessionRepository` add:

```ts
renewExpiry(sessionId: string, expiresAt: Date): Promise<void>;
```

- [ ] **Step 5: Implement repository method**

In `VideoUploadSessionRepository` add:

```ts
async renewExpiry(sessionId: string, expiresAt: Date): Promise<void> {
  await this.sessionRepository.update(sessionId, { expiresAt });
}
```

- [ ] **Step 6: Implement use case**

Create `renew-video-upload-session.use-case.ts`:

```ts
import { Inject, Injectable } from '@nestjs/common';
import { BaseUseCase } from '@shared/application/use-cases/base.use-case';
import {
  type IVideoUploadSessionRepository,
  VIDEO_UPLOAD_SESSION_REPOSITORY,
} from '../../domain/repositories/video-upload-session.repository';
import type { RenewVideoUploadSessionResponse } from '../dtos/video-upload-session.response';
import { VideoUploadSessionGuardService } from '../services/video-upload-session-guard.service';

const MULTIPART_UPLOAD_TTL_HOURS = 24;

@Injectable()
export class RenewVideoUploadSessionUseCase extends BaseUseCase<
  { userId: string; videoId: string; uploadId: string },
  RenewVideoUploadSessionResponse
> {
  constructor(
    @Inject(VIDEO_UPLOAD_SESSION_REPOSITORY)
    private readonly uploadSessionRepository: IVideoUploadSessionRepository,
    private readonly uploadSessionGuardService: VideoUploadSessionGuardService,
  ) {
    super();
  }

  async execute(command: {
    userId: string;
    videoId: string;
    uploadId: string;
  }): Promise<RenewVideoUploadSessionResponse> {
    const session =
      await this.uploadSessionGuardService.getActiveOwnedDraftSession(command);
    const expiresAt = new Date(
      Date.now() + MULTIPART_UPLOAD_TTL_HOURS * 60 * 60 * 1000,
    );

    await this.uploadSessionRepository.renewExpiry(session.id, expiresAt);

    return {
      videoId: session.videoId,
      uploadId: session.uploadId,
      expiresAt: expiresAt.toISOString(),
    };
  }
}
```

- [ ] **Step 7: Run GREEN use case spec**

Run: `npm test -- renew-video-upload-session.use-case.spec.ts --runInBand`

Expected: PASS.

---

### Task 3: Backend Controller Route And Module Registration

**Files:**
- Modify: `src/modules/videos/presentation/dtos/video-upload-session.response.ts`
- Modify: `src/modules/videos/presentation/controllers/videos.controller.ts`
- Modify: `src/modules/videos/presentation/controllers/videos.controller.spec.ts`
- Modify: `src/modules/videos/videos.module.ts`

**Interfaces:**
- Produces endpoint: `POST /studio/videos/:videoId/uploads/:uploadId/renew`
- Response body data shape:

```ts
{
  videoId: string;
  uploadId: string;
  expiresAt: string;
}
```

- [ ] **Step 1: Write failing controller spec**

Add a `renewVideoUploadSessionUseCase` mock next to the existing upload mocks:

```ts
const renewVideoUploadSessionUseCase = {
  execute: jest.fn(),
};
```

Pass it to the controller constructor after `completeVideoUploadUseCase`.

Add test:

```ts
it('renews upload session expiry', async () => {
  renewVideoUploadSessionUseCase.execute.mockResolvedValue({
    videoId: 'video-1',
    uploadId: 'upload-1',
    expiresAt: '2026-05-22T10:00:00.000Z',
  });

  const result = await controller.renewUploadSession(
    'owner-1',
    'video-1',
    'upload-1',
  );

  expect(renewVideoUploadSessionUseCase.execute).toHaveBeenCalledWith({
    userId: 'owner-1',
    videoId: 'video-1',
    uploadId: 'upload-1',
  });
  expect(result).toEqual({
    videoId: 'video-1',
    uploadId: 'upload-1',
    expiresAt: '2026-05-22T10:00:00.000Z',
  });
});
```

- [ ] **Step 2: Run RED controller spec**

Run: `npm test -- videos.controller.spec.ts --runInBand`

Expected: FAIL because `renewUploadSession` and constructor injection do not exist.

- [ ] **Step 3: Add presentation DTO**

In `video-upload-session.response.ts` add:

```ts
export class RenewVideoUploadSessionResponseDto {
  @ApiProperty()
  videoId!: string;

  @ApiProperty()
  uploadId!: string;

  @ApiProperty()
  expiresAt!: string;
}
```

- [ ] **Step 4: Add controller dependency and route**

Import `RenewVideoUploadSessionUseCase` and `RenewVideoUploadSessionResponseDto`, add constructor param, then add:

```ts
@Post('studio/videos/:videoId/uploads/:uploadId/renew')
@ApiSuccessResponse(RenewVideoUploadSessionResponseDto)
async renewUploadSession(
  @CurrentUserId() userId: string,
  @Param('videoId') videoId: string,
  @Param('uploadId') uploadId: string,
): Promise<ApiResponse<RenewVideoUploadSessionResponseDto>> {
  return apiResponseContract(
    await this.renewVideoUploadSessionUseCase.execute({
      userId,
      videoId,
      uploadId,
    }),
  );
}
```

- [ ] **Step 5: Register use case in module**

In `videos.module.ts`, import `RenewVideoUploadSessionUseCase` and add it to `providers` near the upload use cases.

- [ ] **Step 6: Run GREEN controller spec**

Run: `npm test -- videos.controller.spec.ts --runInBand`

Expected: PASS.

---

### Task 4: Frontend API Wrapper And Types

**Files:**
- Modify: `E:/doan/distributed_media_system/fe/src/features/watch/services/mediaService.types.ts`
- Modify: `E:/doan/distributed_media_system/fe/src/features/watch/services/mediaService.ts`

**Interfaces:**
- Produces FE type:

```ts
export interface RenewUploadSessionResponse {
  videoId: string;
  uploadId: string;
  expiresAt: string;
}
```

- Produces API function:

```ts
renewUploadSession(videoId: string, uploadId: string): Promise<ApiResponse<RenewUploadSessionResponse>>
```

- [ ] **Step 1: Add response type**

In `mediaService.types.ts`, near upload response types, add:

```ts
export interface RenewUploadSessionResponse {
  videoId: string;
  uploadId: string;
  expiresAt: string;
}
```

- [ ] **Step 2: Add service wrapper**

In `mediaService.ts`, import `RenewUploadSessionResponse`, then add:

```ts
const renewUploadSession = async (videoId: string, uploadId: string) => {
  return api.post<RenewUploadSessionResponse>(
    `/api/media/studio/videos/${encodeURIComponent(videoId)}/uploads/${encodeURIComponent(uploadId)}/renew`,
    undefined,
    { requireAuth: true }
  );
};
```

Add it to the exported `mediaService` object near `getUploadStatus` and `completeUpload`.

- [ ] **Step 3: Type-check FE**

Run from `E:/doan/distributed_media_system/fe`: `npm run type-check`

Expected: PASS.

---

### Task 5: Frontend Resumable Upload Auto-Renew

**Files:**
- Modify: `E:/doan/distributed_media_system/fe/src/features/watch/services/mediaService.types.ts`
- Modify: `E:/doan/distributed_media_system/fe/src/features/watch/services/mediaService.upload.ts`
- Modify: `E:/doan/distributed_media_system/fe/src/features/watch/services/mediaService.ts`
- Create: `E:/doan/distributed_media_system/fe/src/features/watch/services/mediaService.upload.test.ts`

**Interfaces:**
- Extend `ResumableUploadApi` with:

```ts
renewUploadSession: (videoId: string, uploadId: string) => Promise<ApiResponse<RenewUploadSessionResponse>>;
```

- Extend `UploadResumableParams` with:

```ts
renewBeforeExpiryMs?: number;
```

- [ ] **Step 1: Write failing FE unit test**

Create `mediaService.upload.test.ts` that mocks the upload API and browser XHR enough to verify renewal call order. The key test should use an upload status with `expiresAt` less than the renewal threshold:

```ts
it('renews the upload session before requesting the next part URL when expiry is near', async () => {
  jest.useFakeTimers().setSystemTime(new Date('2026-01-01T10:00:00.000Z'));
  const uploadApi = createUploadApiMock({
    statusExpiresAt: '2026-01-01T10:04:00.000Z',
    renewExpiresAt: '2026-01-02T10:00:00.000Z',
  });
  mockSuccessfulChunkUpload('etag-1');
  const upload = createUploadResumableVideoFile(uploadApi);

  await upload({
    videoId: 'video-1',
    uploadId: 'upload-1',
    file: new File([new Uint8Array(1024)], 'video.mp4'),
    partSizeBytes: 1024,
    renewBeforeExpiryMs: 10 * 60 * 1000,
  });

  expect(uploadApi.renewUploadSession).toHaveBeenCalledWith('video-1', 'upload-1');
  expect(uploadApi.getPartUrls).toHaveBeenCalledAfter(uploadApi.renewUploadSession);
});
```

If `toHaveBeenCalledAfter` is not available in this Jest setup, assert call order via `mock.invocationCallOrder`:

```ts
expect(uploadApi.renewUploadSession.mock.invocationCallOrder[0]).toBeLessThan(
  uploadApi.getPartUrls.mock.invocationCallOrder[0],
);
```

- [ ] **Step 2: Run RED FE test**

Run from `E:/doan/distributed_media_system/fe`: `npm test -- mediaService.upload.test.ts --runInBand`

Expected: FAIL because `renewUploadSession` is not part of the uploader contract.

- [ ] **Step 3: Extend types and API contract**

In `UploadResumableParams`, add:

```ts
renewBeforeExpiryMs?: number;
```

In `mediaService.upload.ts`, import `RenewUploadSessionResponse` and extend `ResumableUploadApi`:

```ts
renewUploadSession: (
  videoId: string,
  uploadId: string
) => Promise<ApiResponse<RenewUploadSessionResponse>>;
```

Pass `renewUploadSession` in `mediaService.ts`:

```ts
const uploadResumableVideoFile = createUploadResumableVideoFile({
  getUploadStatus,
  getPartUrls,
  completePart,
  completeUpload,
  renewUploadSession,
});
```

- [ ] **Step 4: Implement minimal renewal helper**

Inside `createUploadResumableVideoFile`, track `sessionExpiresAtMs` from upload status and add:

```ts
const DEFAULT_RENEW_BEFORE_EXPIRY_MS = 10 * 60 * 1000;
let sessionExpiresAtMs: number | null = null;

const renewIfNeeded = async () => {
  if (sessionExpiresAtMs === null) {
    return;
  }

  const thresholdMs = renewBeforeExpiryMs ?? DEFAULT_RENEW_BEFORE_EXPIRY_MS;
  if (sessionExpiresAtMs - Date.now() > thresholdMs) {
    return;
  }

  const renewRes = await uploadApi.renewUploadSession(videoId, uploadId);
  if (!renewRes.success || !renewRes.data) {
    throw new Error(renewRes.message || 'Failed to renew upload session');
  }

  sessionExpiresAtMs = new Date(renewRes.data.expiresAt).getTime();
};
```

Set `sessionExpiresAtMs` after status success:

```ts
sessionExpiresAtMs = new Date(statusRes.data.expiresAt).getTime();
```

Call `await renewIfNeeded()` before:

- `getPartUrls(...)`
- `completePart(...)`
- final `completeUpload(...)`
- immediate complete path when `partsToUpload.length === 0`

- [ ] **Step 5: Run GREEN FE test**

Run from `E:/doan/distributed_media_system/fe`: `npm test -- mediaService.upload.test.ts --runInBand`

Expected: PASS.

---

### Task 6: Final Verification

**Files:**
- All files touched in Tasks 1-5.

**Interfaces:**
- Backend route and use case compile.
- Frontend uploader compiles and tests pass.

- [ ] **Step 1: Run backend focused specs**

Run from `E:/doan/distributed_media_system/media_service`:

```bash
npm test -- video-upload-session-guard.service.spec.ts --runInBand
npm test -- renew-video-upload-session.use-case.spec.ts --runInBand
npm test -- videos.controller.spec.ts --runInBand
```

Expected: all PASS.

- [ ] **Step 2: Run backend build**

Run from `E:/doan/distributed_media_system/media_service`: `npm run build`

Expected: PASS.

- [ ] **Step 3: Run frontend focused test**

Run from `E:/doan/distributed_media_system/fe`: `npm test -- mediaService.upload.test.ts --runInBand`

Expected: PASS.

- [ ] **Step 4: Run frontend type-check**

Run from `E:/doan/distributed_media_system/fe`: `npm run type-check`

Expected: PASS.

- [ ] **Step 5: Inspect git diff**

Run from `E:/doan/distributed_media_system/media_service`: `git status --short`

Run from `E:/doan/distributed_media_system/fe`: `git status --short`

Expected: only planned BE and FE files changed.

---

## Self-Review

- Spec coverage: Covers strict expiry enforcement, active session renewal, BE endpoint, FE proactive renewal, tests, and build/type-check verification.
- Placeholder scan: No open placeholders remain; every task has exact paths and commands.
- Type consistency: Backend uses `RenewVideoUploadSessionResponse`; frontend uses `RenewUploadSessionResponse`; endpoint path matches `/renew` in both BE and FE.
- Scope check: This is one cohesive feature spanning BE API and FE caller; no unrelated upload concurrency/idempotency changes are included.
