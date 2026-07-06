# Processing Job Outbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make transcode job dispatch durable so a video cannot be saved as `processing` without a retryable processing job intent.

**Architecture:** Reuse the existing `outbox_messages` table. SAFE moderation writes video state and a `video.processing.requested` outbox message in one transaction; a new infrastructure worker dispatches those outbox rows to the existing BullMQ queue.

**Tech Stack:** NestJS, TypeScript, TypeORM, Jest, BullMQ, existing outbox table.

## Global Constraints

- Application layer must not import infrastructure code.
- Infrastructure layer owns TypeORM, BullMQ, and concrete dispatcher behavior.
- Do not change `media_processing_service`; it continues consuming BullMQ `transcode-job` jobs.
- No broad refactors or unrelated cleanup.
- Do not commit unless explicitly requested.

---

### Task 1: Transactional Processing Outbox Intent

**Files:**
- Modify: `src/modules/videos/application/interfaces/video-outbox-transaction.interface.ts`
- Modify: `src/modules/videos/infrastructure/persistence/video-outbox-transaction.service.ts`
- Modify: `src/modules/videos/application/use-cases/handle-video-moderation-completed.use-case.ts`
- Modify: `src/modules/videos/application/use-cases/handle-video-moderation-completed.use-case.spec.ts`
- Modify: `src/modules/videos/application/constants/video-event.constants.ts`

**Interfaces:**
- Produces: `saveVideoWithOutbox(video: VideoEntity, outboxMessages: VideoOutboxMessage | VideoOutboxMessage[]): Promise<void>`
- Produces: `VIDEO_PROCESSING_REQUESTED_TOPIC = 'video.processing.requested'`

- [ ] Write a failing test that SAFE moderation uses `saveVideoWithOutbox` with a processing outbox message and does not directly enqueue BullMQ.
- [ ] Update `IVideoOutboxTransaction` to accept one or many outbox messages.
- [ ] Update `VideoOutboxTransactionService` to insert all messages in the same transaction.
- [ ] Update SAFE moderation path to call `saveVideoWithOutbox` with topic `video.processing.requested` and the existing transcode payload.
- [ ] Run `npm test -- handle-video-moderation-completed.use-case.spec.ts --runInBand`.

### Task 2: BullMQ Processing Outbox Worker

**Files:**
- Create: `src/modules/videos/infrastructure/queue/video-processing-outbox.worker.ts`
- Create: `src/modules/videos/infrastructure/queue/video-processing-outbox.worker.spec.ts`
- Modify: `src/modules/videos/videos.module.ts`

**Interfaces:**
- Consumes: `VIDEO_PROCESSING_REQUESTED_TOPIC`
- Consumes: `IVideoProcessingJobDispatcher.enqueueTranscodeJob(payload): Promise<void>`

- [ ] Write worker tests for successful enqueue and retryable failure.
- [ ] Implement worker claim query scoped to pending `video.processing.requested` rows.
- [ ] Dispatch each claimed payload through `VIDEO_PROCESSING_JOB_DISPATCHER`.
- [ ] Mark successful rows `published`.
- [ ] Mark failed rows `pending` with incremented `attempt_count`, `next_attempt_at`, unlocked row, and `last_error`.
- [ ] Register worker in `VideosModule`.
- [ ] Run `npm test -- video-processing-outbox.worker.spec.ts --runInBand`.

### Task 3: Summary And Verification

**Files:**
- Create: `docs/upload-processing-outbox-summary.html`

- [ ] Write an HTML summary explaining the old failure mode, new flow, touched files, and verification commands.
- [ ] Run focused tests for changed use case and worker.
- [ ] Run `npm run build`.

## Self-Review

- Spec coverage: all requirements map to the three tasks above.
- Placeholder scan: no pending placeholders remain.
- Type consistency: topic constant and `saveVideoWithOutbox` signature are used consistently.
