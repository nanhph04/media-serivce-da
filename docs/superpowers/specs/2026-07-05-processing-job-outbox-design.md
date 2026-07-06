# Processing Job Outbox Design

## Goal

Prevent videos from getting stuck in `processing` when moderation succeeds but BullMQ job enqueue fails.

## Current Problem

`HandleVideoModerationCompletedUseCase` currently marks a SAFE video as `processing`, saves it to the database, then directly calls BullMQ enqueue. If the database save succeeds and enqueue fails, the video remains `processing` without a processing job. The moderation event is not marked processed, but retrying the same event sees the video is no longer `pending_moderation` and skips dispatch.

The watchdog is not sufficient for this case. It only marks stale videos failed when the processing pipeline health check is unhealthy. If the worker is healthy but this one job was never enqueued, the watchdog logs the stale video and leaves it in `processing`.

## Chosen Approach

Keep the existing BullMQ contract with `media_processing_service` and add a local durable outbox dispatcher in `media_service`.

## Data Flow

1. SAFE moderation result is consumed.
2. Media service builds a transcode job payload.
3. Media service saves the video status change to `processing` and inserts an outbox row with topic `video.processing.requested` in the same database transaction.
4. A BullMQ outbox worker claims pending `video.processing.requested` rows.
5. The worker calls the existing `VideoQueueService.enqueueTranscodeJob(payload)`.
6. If enqueue succeeds, the outbox row is marked `published`.
7. If enqueue fails, the row is returned to `pending` with retry backoff metadata.

## Boundaries

- Application layer defines the topic constant and uses the existing video outbox transaction port.
- Infrastructure layer implements the BullMQ outbox worker because it depends on TypeORM, Redis/BullMQ, and the concrete dispatcher.
- Existing Kafka outbox publisher remains responsible for Kafka integration events.
- Processing service remains unchanged and continues consuming BullMQ `transcode-job` jobs.

## Error Handling

- Failure to write the video/outbox transaction aborts the moderation handling and releases the event processing lock.
- Failure to enqueue the BullMQ job does not affect the saved video state. The outbox row remains pending for retry.
- Watchdog remains a safety net for videos genuinely stuck in processing.

## Testing

- Use-case tests assert SAFE moderation persists a `video.processing.requested` outbox message instead of direct enqueue.
- Infrastructure worker tests assert successful enqueue marks outbox published.
- Infrastructure worker tests assert enqueue failure returns outbox row to pending with retry metadata.
