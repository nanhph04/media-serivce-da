# Bieu do tuan tu

## Quy tac ve bieu do

- Moi actor/service/storage/broker/database chi nen co mot participant duy nhat.
- Phan biet bucket, topic, namespace, status bang message hoac note, khong tao participant moi.
- Ten service, topic/event, endpoint, bucket/object key va thuat ngu chuyen mon giu tieng Anh.

## Tai video len

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Creator
    participant Media as Media Service
    participant Storage as MinIO Storage
    participant Kafka
    participant Moderation as Moderation Service
    participant Processor as Media Processing Service

    Creator->>Media: Start upload
    Media->>Storage: Create multipart upload in bucket raw
    Media-->>Creator: videoId + uploadId + partSizeBytes + optional thumbnail upload URL
    loop For each missing part
        Creator->>Media: Request part URLs
        Media-->>Creator: presigned part URLs
        Creator->>Storage: Upload part bytes to bucket raw
        Storage-->>Creator: ETag
        Creator->>Media: Mark part completed with ETag
    end
    opt Network lost or app reloaded
        Creator->>Media: Get upload status
        Media-->>Creator: completed partNumbers + ETags
        Creator->>Media: Request URLs for missing parts
    end
    Creator->>Media: Complete multipart upload
    Media->>Storage: Complete multipart upload into raw object
    opt Custom thumbnail
        Creator->>Storage: Upload thumbnail to bucket public
    end

    Creator->>Media: Submit upload
    Media->>Storage: Copy raw draft to raw confirmed
    Media->>Storage: Delete raw draft best-effort
    alt Custom thumbnail provided
        Media->>Storage: Validate custom thumbnail object
        Media->>Media: Set thumbnailSource=custom, thumbnailStatus=ready
    else No custom thumbnail
        Media->>Media: Set thumbnailSource=auto, thumbnailStatus=processing
    end
    Media->>Kafka: Publish video.moderation.requested
    Media-->>Creator: Waiting for moderation

    Kafka-->>Moderation: video.moderation.requested
    Moderation->>Storage: Read raw confirmed from bucket raw
    Moderation->>Kafka: Publish video.moderation.completed

    Kafka-->>Media: video.moderation.completed

    alt SAFE
        Media->>Processor: Queue transcode job with optional public thumbnail target bucket/key
        Processor->>Storage: Read raw confirmed from bucket raw
        opt Auto thumbnail
            Processor->>Storage: Write thumbnail JPEG to bucket public
            Processor->>Kafka: Publish video.thumbnail.generated
            Kafka-->>Media: video.thumbnail.generated
            Media->>Media: Set thumbnailStatus=ready
        end
        Processor->>Storage: Write HLS and segments to bucket processed
        Processor->>Kafka: Publish video.processed.success
        Kafka-->>Media: video.processed.success
        Media->>Media: Mark video READY
        Media->>Storage: Delete raw confirmed best-effort from bucket raw
    else REJECTED or moderation failed
        Media->>Media: Mark video REJECTED/FAILED
    else Processing failed
        Processor->>Kafka: Publish video.processed.failed
        Kafka-->>Media: video.processed.failed
        Media->>Media: Mark video FAILED
    end
```

## Raw file lifecycle

- `uploads/raw/{channelId}/...` is reserved by `POST /api/media/studio/videos/uploads`.
- The client uploads the raw video through MinIO multipart upload parts. Media Service stores `uploadId`, `partSizeBytes`, file metadata and uploaded part ETags in `video_upload_sessions` and `video_upload_parts`.
- `POST /api/media/studio/videos/:videoId/uploads/:uploadId/complete` asks MinIO to assemble the uploaded parts into one raw object at `rawFileKey`.
- `POST /api/media/studio/videos/:videoId/uploads/:uploadId/submit` copies the completed draft object to `uploads/confirmed/{videoId}/{uuid}.mp4`.
- After `video.processed.success`, Media Service deletes the confirmed raw object best-effort.
- If MinIO delete fails, playback still uses bucket `processed`; leftover raw objects can be cleaned manually or by lifecycle cleanup.
- Failed, rejected, cancelled draft, expired draft and hard-deleted videos use their own cleanup flows.

## Resumable upload client rule

- User selects one complete video file.
- Client computes `totalParts = ceil(file.size / partSizeBytes)`.
- For each part, client reads bytes with `file.slice(start, end)`.
- After each successful part PUT, MinIO returns `ETag`; client sends it to `parts/:partNumber/completed`.
- If network is lost, client calls `status`, skips completed `partNumber`s, requests URLs only for missing parts, and continues upload.
- User never manually chooses parts; the part split is only an implementation detail between client, Media Service and MinIO.

## Thumbnail flow

- Custom thumbnail:
  - Client calls `POST /api/media/studio/videos/uploads` with `thumbnailExtension`.
  - Media Service returns `thumbnailObjectKey` and `thumbnailUploadUrl`.
  - Client uploads the image to bucket `public` (`MINIO_PUBLIC_BUCKET`) using the presigned PUT URL.
  - Client sends `thumbnailObjectKey` on `submit`.
  - Media Service validates prefix, extension and size in `MINIO_PUBLIC_BUCKET`, then sets `thumbnailSource = custom`, `thumbnailStatus = ready`, and stores a permanent public `thumbnailUrl`.
  - Late auto thumbnail events never overwrite custom thumbnails.

- Auto thumbnail:
  - If `submit` has no `thumbnailObjectKey`, Media Service sets `thumbnailSource = auto`, `thumbnailStatus = processing`.
  - After moderation `SAFE`, Media Service enqueues the transcode job with target bucket `MINIO_PUBLIC_BUCKET` and key `videos/{videoId}/thumbnails/default.jpg`.
  - Media Processing Service uses FFmpeg to capture a frame, uploads JPEG to bucket `public`, then publishes `video.thumbnail.generated`.
  - Media Service consumes `video.thumbnail.generated` and updates `thumbnailUrl`, `thumbnail_object_key`, and `thumbnailStatus = ready`.
  - Clients render `thumbnailUrl` directly. It is a permanent public MinIO object URL, not a presigned GET URL.
  - If generation fails after retry, Media Processing Service publishes `video.thumbnail.failed`; Media Service sets `thumbnailStatus = failed` and clients should render a placeholder.
