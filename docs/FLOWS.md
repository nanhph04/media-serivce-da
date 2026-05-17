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

    Creator->>Media: Init upload
    Media-->>Creator: videoId + raw upload URL + optional thumbnail upload URL
    Creator->>Storage: Upload raw video to bucket raw
    opt Custom thumbnail
        Creator->>Storage: Upload thumbnail to bucket processed
    end

    Creator->>Media: Confirm upload
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
        Media->>Processor: Queue transcode job with optional thumbnail target key
        Processor->>Storage: Read raw confirmed from bucket raw
        opt Auto thumbnail
            Processor->>Storage: Write thumbnail JPEG to bucket processed
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

- `uploads/raw/{channelId}/...` is created by `init-upload` and used by the client presigned upload URL.
- `confirm-upload` copies the draft object to `uploads/confirmed/{videoId}/{uuid}.mp4`.
- After `video.processed.success`, Media Service deletes the confirmed raw object best-effort.
- If MinIO delete fails, playback still uses bucket `processed`; leftover raw objects can be cleaned manually or by lifecycle cleanup.
- Failed, rejected, cancelled draft, expired draft and hard-deleted videos use their own cleanup flows.

## Thumbnail flow

- Custom thumbnail:
  - Client calls `POST /api/media/videos/init-upload` with `thumbnailExtension`.
  - Media Service returns `thumbnailObjectKey` and `thumbnailUploadUrl`.
  - Client uploads the image to bucket `processed`.
  - Client sends `thumbnailObjectKey` on `confirm-upload`.
  - Media Service validates prefix, extension and size, then sets `thumbnailSource = custom`, `thumbnailStatus = ready`.
  - Late auto thumbnail events never overwrite custom thumbnails.

- Auto thumbnail:
  - If `confirm-upload` has no `thumbnailObjectKey`, Media Service sets `thumbnailSource = auto`, `thumbnailStatus = processing`.
  - After moderation `SAFE`, Media Service enqueues the transcode job with target key `videos/{videoId}/thumbnails/default.jpg`.
  - Media Processing Service uses FFmpeg to capture a frame, uploads JPEG to bucket `processed`, then publishes `video.thumbnail.generated`.
  - Media Service consumes `video.thumbnail.generated` and updates `thumbnailUrl`, `thumbnail_object_key`, and `thumbnailStatus = ready`.
  - If generation fails after retry, Media Processing Service publishes `video.thumbnail.failed`; Media Service sets `thumbnailStatus = failed` and clients should render a placeholder.
