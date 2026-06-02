# MEDIA SERVICE ENV

Membership auto-renew:

```text
MEMBERSHIP_AUTO_RENEW_ENABLED=true
MEMBERSHIP_RENEW_REMINDER_HOURS=24
MEMBERSHIP_RENEW_BATCH_SIZE=100
MEMBERSHIP_RENEW_MAX_RETRY=3
MEMBERSHIP_RENEW_RETRY_DELAY_HOURS=12
MEMBERSHIP_RENEW_INTERVAL_MS=300000
```

Kafka topics used by membership auto-renew:

```text
KAFKA_MEMBERSHIP_PAYMENT_SUCCESS_TOPIC=membership.payment.success
KAFKA_MEMBERSHIP_AUTO_RENEW_REMINDER_REQUESTED_TOPIC=membership.auto_renew.reminder_requested
KAFKA_MEMBERSHIP_AUTO_RENEW_REQUESTED_TOPIC=membership.auto_renew.requested
KAFKA_MEMBERSHIP_AUTO_RENEW_FAILED_TOPIC=membership.auto_renew.failed
KAFKA_VIDEO_THUMBNAIL_GENERATED_TOPIC=video.thumbnail.generated
KAFKA_VIDEO_THUMBNAIL_FAILED_TOPIC=video.thumbnail.failed
```

When `KAFKA_AUTO_CREATE_TOPICS=true`, include these topics in
`KAFKA_TOPICS_TO_CREATE`.

Video moderation topic partitioning:

```text
KAFKA_VIDEO_MODERATION_REQUESTED_TOPIC=video.moderation.requested
KAFKA_VIDEO_MODERATION_REQUESTED_PARTITIONS=1
```

- `KAFKA_VIDEO_MODERATION_REQUESTED_PARTITIONS` controls the desired partition
  count when media-service initializes `video.moderation.requested`. Existing
  topics are increased when the configured value is higher; they are not
  decreased because Kafka does not support partition reduction.
- Set this value at least as high as `MODERATION_WORKER_CONCURRENCY` when
  `moderation-service` parallel processing is enabled.

Finance internal payment charge:

```text
FINANCE_SERVICE_URL=http://localhost:4004
FINANCE_INTERNAL_GATEWAY_SECRET=finance-gateway-secret
```

- `FINANCE_SERVICE_URL`: direct finance-service base URL without `/api`.
- `FINANCE_INTERNAL_GATEWAY_SECRET`: finance-service internal gateway secret
  sent as `x-internal-secret` when media-service calls internal finance-service
  APIs. This value must match finance-service `INTERNAL_GATEWAY_SECRET`.

Inbound internal APIs exposed by media-service:

```text
MEDIA_INTERNAL_SERVICE_ALLOWLIST=finance-service
FINANCE_SERVICE_MEDIA_INTERNAL_SECRET=change-me
```

- `MEDIA_INTERNAL_SERVICE_ALLOWLIST`: comma-separated callers allowed to call
  media-service internal APIs.
- Internal caller secrets use
  `<CALLER_SERVICE>_MEDIA_INTERNAL_SECRET`, where hyphens become underscores
  and names are uppercased. Example: `finance-service` uses
  `FINANCE_SERVICE_MEDIA_INTERNAL_SECRET`.
- `FINANCE_MEDIA_INTERNAL_SECRET` is accepted as a legacy alias for
  `finance-service`.

Object storage for public media assets:

```text
MINIO_PROCESSED_BUCKET=media-processed
MINIO_PUBLIC_BUCKET=media-public
MINIO_PUBLIC_ENDPOINT=
MINIO_PUBLIC_PORT=
MINIO_PUBLIC_USE_SSL=
```

`MINIO_PUBLIC_BUCKET` must allow public `s3:GetObject` reads. Media service
creates the bucket and applies a public-read policy during startup when it can
reach MinIO.

Stored in `MINIO_PUBLIC_BUCKET`:

- Channel avatar and banner uploads. Clients send multipart files to
  media-service through the gateway; media-service uploads the objects to MinIO
  and stores permanent public object URLs. These uploads do not use presigned
  PUT URLs.
- Custom video thumbnails uploaded by clients through presigned PUT URLs.
- Auto video thumbnails written by media-processing-service to the public bucket
  passed in the transcode job.

Clients render the stored `avatarUrl`, `bannerUrl`, and `thumbnailUrl` directly.
These URLs are not presigned GET URLs.

AI video metadata suggestions using Z.AI GLM:

```text
ZAI_API_KEY=your-zai-api-key
ZAI_BASE_URL=https://api.z.ai/api
ZAI_METADATA_MODEL=glm-4.5-flash
ZAI_METADATA_TIMEOUT_MS=15000
ZAI_METADATA_MAX_OUTPUT_TOKENS=800
ZAI_METADATA_TEMPERATURE=0.7
```

- `ZAI_API_KEY`: Z.AI API key used by media-service to generate suggested
  video title, description, hashtags, and existing tag selections.
- `ZAI_BASE_URL`: Z.AI API base URL. Keep the default unless the provider
  changes endpoint.
- `ZAI_METADATA_MODEL`: model id for metadata suggestions. Default is
  `glm-4.5-flash`.
- `ZAI_METADATA_TIMEOUT_MS`: request timeout for AI suggestions.
- `ZAI_METADATA_MAX_OUTPUT_TOKENS`: max generated tokens for the JSON response.
- `ZAI_METADATA_TEMPERATURE`: generation creativity. Lower values are more
  deterministic.
