MEDIA SERVICE EVENTS
====================

All integration events use the shared envelope:

```ts
interface IIntegrationEvent<T = unknown> {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: string;
  version: number;
  traceId: string;
  spanId?: string;
  sourceService: string;
  data: T;
}
```

1) membership.auto_renew.reminder_requested
-------------------------------------------

Purpose:

- Published by media-service before an active auto-renew membership expires.
- identity-service consumes this event and sends the renewal reminder email.

Topic:

```text
membership.auto_renew.reminder_requested
```

Data:

```json
{
  "membershipRecordId": "membership-record-id",
  "userId": "user-id",
  "channelId": "channel-id",
  "channelName": "Creator Channel",
  "membershipTierId": "tier-id",
  "tierName": "Premium",
  "coinAmount": 100,
  "renewalDate": "2026-05-18T00:00:00.000Z"
}
```

2) membership.auto_renew.requested
----------------------------------

Purpose:

- Published by media-service when membership renewal is due.
- finance-service consumes this event and charges the user's wallet.

Topic:

```text
membership.auto_renew.requested
```

Data:

```json
{
  "membershipRecordId": "membership-record-id",
  "userId": "user-id",
  "channelId": "channel-id",
  "channelOwnerId": "creator-user-id",
  "membershipTierId": "tier-id",
  "coinAmount": 100,
  "currentExpiryDate": "2026-05-18T00:00:00.000Z",
  "paymentType": "renew",
  "idempotencyKey": "membership-renew:membership-record-id:2026-05-18T00:00:00.000Z"
}
```

3) membership.auto_renew.failed
-------------------------------

Purpose:

- Consumed by media-service when finance-service cannot charge an auto-renewal.
- media-service increments retry state, schedules next retry, or disables auto-renew after max retries.

Topic:

```text
membership.auto_renew.failed
```

Data:

```json
{
  "membershipRecordId": "membership-record-id",
  "userId": "user-id",
  "channelId": "channel-id",
  "membershipTierId": "tier-id",
  "reasonCode": "INSUFFICIENT_BALANCE",
  "retryable": true,
  "idempotencyKey": "membership-renew:membership-record-id:2026-05-18T00:00:00.000Z"
}
```

4) membership.payment.success
-----------------------------

Purpose:

- Consumed by media-service after finance-service charges a membership payment.
- For `paymentType = renew`, media-service extends the membership expiry and resets renewal retry/reminder state.

Expected data fields:

```json
{
  "userId": "user-id",
  "channelId": "channel-id",
  "membershipTierId": "tier-id",
  "channelOwnerId": "creator-user-id",
  "coinAmount": 100,
  "paymentTransactionId": "txn-id",
  "paymentType": "renew",
  "chargedCoinAmount": 100,
  "ledgerReferenceId": "txn-id",
  "membershipRecordId": "membership-record-id",
  "currentExpiryDate": "2026-05-18T00:00:00.000Z",
  "expiryDate": null
}
```

5) video.thumbnail.generated
----------------------------

Purpose:

- Consumed by media-service after media-processing-service generates an auto thumbnail.
- media-service updates video thumbnail metadata only when the video still uses `thumbnailSource = auto`.
- If the video already uses `thumbnailSource = custom`, the event is ignored so user-uploaded thumbnail is not overwritten.

Topic:

```text
video.thumbnail.generated
```

Data:

```json
{
  "videoId": "video-id",
  "thumbnailObjectKey": "videos/video-id/thumbnails/default.jpg",
  "thumbnailUrl": "http://localhost:9000/media-processed/videos/video-id/thumbnails/default.jpg",
  "width": 1280,
  "height": 720,
  "capturedAtSecond": 12
}
```

6) video.thumbnail.failed
-------------------------

Purpose:

- Consumed by media-service when media-processing-service cannot generate an auto thumbnail after retries.
- media-service sets `thumbnailStatus = failed` only for videos using `thumbnailSource = auto`.

Topic:

```text
video.thumbnail.failed
```

Data:

```json
{
  "videoId": "video-id",
  "reasonCode": "FFMPEG_FAILED",
  "message": "ffmpeg exited with code 1",
  "retryable": false
}
```
