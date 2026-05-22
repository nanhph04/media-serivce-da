MEDIA SERVICE ENV
=================

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

Object storage for thumbnails:

```text
MINIO_PROCESSED_BUCKET=media-processed
MINIO_PUBLIC_BUCKET=media-public
MINIO_PUBLIC_ENDPOINT=
MINIO_PUBLIC_PORT=
MINIO_PUBLIC_USE_SSL=
```

Custom thumbnail uploads use presigned PUT URLs in `MINIO_PROCESSED_BUCKET`.
Channel avatar/banner uploads are stored in `MINIO_PUBLIC_BUCKET` and responses
store the permanent public object URL.
Auto thumbnails are written by media-processing-service to the same bucket.
