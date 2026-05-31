# Media Service API

**Last updated:** 31/05/2026

**Base URL:** `/api/media`

## Ghi chu chung

- `x-user-id`: He thong tu set tu gateway/auth service, frontend/client khong nen tu dien tay.
- `x-user-role`: Duoc gateway/auth service set cho cac API can role.
- `x-internal-secret`: He thong noi bo tu set khi goi qua gateway/service noi bo.
- API co `SkipInternalGatewayGuard` la API public, khong can `x-internal-secret`.
- Validation dang bat `whitelist + forbidNonWhitelisted + transform`.
- Success response THUC TE duoc wrap theo envelope:

```json
  {
    "success": true,
    "statusCode": 200,
    "data": { ... } | [ ... ] | "Hello World!" | null,
    "message": "optional",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
```

- Voi endpoint `POST`, neu NestJS tra HTTP 201 thi response envelope co `statusCode = 201`.
- Error response dung format `ApiError` o cuoi tai lieu nay.

## 1. HEALTH CHECK

### 1.1 GET `/api/media/`

- Muc dich: kiem tra service dang chay.
- Header:
  - Khong yeu cau.
- Request:
  - Khong co body/query/path param.
- Response HTTP 200:
  - Envelope:
    - `success`: true
    - `code`: 200
    - `data`: string
  - `data` hien tai: `"Hello World!"`

## 2. CHANNEL APIs

### 2.0 GET `/api/media/me/channel`

- Muc dich: lay channel cua user hien tai de frontend resolve `channelId` creator context.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Ghi chu:
  - Identity/Auth User Info KHONG chua `channelId`; frontend phai goi endpoint nay de lay.
  - Neu user chua co channel thi tra `NOT_FOUND` / HTTP 404.
  - Neu channel dang `inactive` hoac `suspended`, API van tra ve `status` hien tai de frontend tu xu ly.
- Response HTTP 200:
  - Envelope `data`:
    - `channelId` (string)
    - `userId` (string)
    - `status` (string)
    - `isEligibleForMembership` (boolean)
    - `isMembershipClosedByAdmin` (boolean)
    - `membershipReviewStatus` (`not_requested` | `pending` | `approved` | `rejected`)
    - `membershipRejectionReason` (string | null)
    - `membershipRequestedAt` (string ISO | null)
    - `membershipReviewedAt` (string ISO | null)

### 2.1 POST `/api/media/me/channel`

- Muc dich: tao channel moi.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Body:
  - `name` (string, bat buoc, max 100): Nguoi dung nhap
  - `bio` (string, bat buoc, max 1000): Nguoi dung nhap
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Response HTTP 201:
  - Envelope `data`:
    - `id` (string)
    - `userId` (string)
    - `name` (string)
    - `bio` (string)
    - `isEligibleForMembership` (boolean)
    - `isMembershipClosedByAdmin` (boolean)
    - `membershipReviewStatus` (`not_requested` | `pending` | `approved` | `rejected`)
    - `membershipRejectionReason` (string | null)
    - `membershipRequestedAt` (string ISO | null)
    - `membershipReviewedAt` (string ISO | null)
    - `avatarUrl` (string)
    - `bannerUrl` (string)
    - `status` (string)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

### 2.2 PATCH `/api/media/me/channel`

- Muc dich: cap nhat channel.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): channelId
- Body:
  - `name` (string, optional, max 100): Nguoi dung nhap
  - `bio` (string, optional, max 1000): Nguoi dung nhap
  - `avatarUrl` (string, optional): URL anh public co dinh, thuong lay tu `POST /api/media/me/channel/avatar`
  - `bannerUrl` (string, optional): URL anh public co dinh, thuong lay tu `POST /api/media/me/channel/banner`
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `userId` (string)
    - `name` (string)
    - `bio` (string)
    - `isEligibleForMembership` (boolean)
    - `isMembershipClosedByAdmin` (boolean)
    - `membershipReviewStatus` (`not_requested` | `pending` | `approved` | `rejected`)
    - `membershipRejectionReason` (string | null)
    - `membershipRequestedAt` (string ISO | null)
    - `membershipReviewedAt` (string ISO | null)
    - `avatarUrl` (string)
    - `bannerUrl` (string)
    - `status` (string)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

### 2.2A POST `/api/media/me/channel/avatar`

- Muc dich: upload avatar channel len MinIO public bucket va cap nhat `avatarUrl` cua channel hien tai.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Content-Type: `multipart/form-data`
- Form data:
  - `file` (binary, bat buoc): anh JPEG, PNG, hoac WebP. Gioi han 5MB.
- Ghi chu:
  - Backend upload object vao `MINIO_PUBLIC_BUCKET`.
  - Response `avatarUrl` la URL MinIO public co dinh, khong phai presigned GET URL.
  - Client dung truc tiep URL nay de render anh.
- Response HTTP 200:
  - Envelope `data`: cung shape voi `ChannelResponse`, trong do `avatarUrl` da duoc cap nhat.

### 2.2B POST `/api/media/me/channel/banner`

- Muc dich: upload banner channel len MinIO public bucket va cap nhat `bannerUrl` cua channel hien tai.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Content-Type: `multipart/form-data`
- Form data:
  - `file` (binary, bat buoc): anh JPEG, PNG, hoac WebP. Gioi han 10MB.
- Ghi chu:
  - Backend upload object vao `MINIO_PUBLIC_BUCKET`.
  - Response `bannerUrl` la URL MinIO public co dinh, khong phai presigned GET URL.
  - Client dung truc tiep URL nay de render anh.
- Response HTTP 200:
  - Envelope `data`: cung shape voi `ChannelResponse`, trong do `bannerUrl` da duoc cap nhat.

### 2.3 GET `/api/media/channels/:id`

- Muc dich: lay chi tiet channel public.
- Public API: khong can `x-internal-secret`.
- Path param:
  - `id` (string): channelId
- Request:
  - Khong co body.
- Ghi chu:
  - `membershipTiers` chi tra cac tier co `isAcceptingNew = true`.
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `userId` (string)
    - `name` (string)
    - `bio` (string)
    - `isEligibleForMembership` (boolean)
    - `isMembershipClosedByAdmin` (boolean)
    - `membershipReviewStatus` (`not_requested` | `pending` | `approved` | `rejected`)
    - `membershipRejectionReason` (string | null)
    - `membershipRequestedAt` (string ISO | null)
    - `membershipReviewedAt` (string ISO | null)
    - `avatarUrl` (string)
    - `bannerUrl` (string)
    - `status` (string)
    - `membershipEligibility` (object)
      - `isEligible` (boolean)
      - `readyVideoCount` (number)
      - `minReadyVideoCount` (number)
      - `totalVideoViews` (number)
      - `minTotalVideoViews` (number)
      - `missingRequirements` (string[])
    - `membershipTiers` (array)
      - `id` (string)
      - `channelId` (string)
      - `name` (string)
      - `level` (number)
      - `priceCoin` (number)
      - `isAcceptingNew` (boolean)
      - `createdAt` (string ISO)
      - `updatedAt` (string ISO)
    - `publicVideos` (array)
      - `id` (string)
      - `title` (string)
      - `category` (string)
      - `tags` (string[])
      - `status` (string)
      - `thumbnailUrl` (string | null)
      - `publishedAt` (string ISO | null)

### 2.4 GET `/api/media/channels/:id/membership-status`

- Muc dich: kiem tra user hien tai co membership active trong channel hay khong.
- Ghi chu them:
  - Endpoint nay chi kiem tra membership theo TUNG channel.
  - Endpoint nay KHONG phai API list active memberships cho man hinh Profile.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): channelId
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Response HTTP 200:
  - Envelope `data`:
    - `isActive` (boolean)
    - `membershipId` (string | null)
    - `expiryDate` (string ISO | null)
    - `canRenew` (boolean)
    - `canUpgrade` (boolean)
    - `membershipBlockedReason` (string | null)
    - `isMembershipClosedByAdmin` (boolean)

### 2.5 GET `/api/media/memberships/me?page=1&limit=20`

- Muc dich: lay danh sach membership/gói hoi vien cua user hien tai tren tat ca channel.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Query:
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Ghi chu:
  - API nay tra ve CAC membership record hien co cua user, khong chi rieng membership active.
  - Frontend dung `isActive` de phan biet membership con hieu luc hay da het han/khong kha dung.
  - `membershipId` trong response la id cua membership record.
  - `tierId` la id cua membership tier hien dang gan voi membership record.
  - `startedAt` hien tai map tu `createdAt` cua membership record.
  - `membershipBlockedReason` hien tai chi co gia tri `ADMIN_CLOSED` khi channel bi admin dong membership; cac truong hop khac la `null`.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `membershipId` (string)
    - `channelId` (string)
    - `channelName` (string)
    - `channelAvatarUrl` (string | null)
    - `tierId` (string)
    - `tierName` (string)
    - `tierLevel` (number)
    - `priceCoin` (number)
    - `startedAt` (string ISO)
    - `expiryDate` (string ISO | null)
    - `isActive` (boolean)
    - `canRenew` (boolean)
    - `canUpgrade` (boolean)
    - `isMembershipClosedByAdmin` (boolean)
    - `membershipBlockedReason` (string | null)
  - Envelope `pagination`:
    - `page` (number)
    - `limit` (number)
    - `total` (number)
    - `totalPages` (number)

### 2.6 PATCH `/api/media/admin/channels/:id/membership`

- Muc dich: admin dong/mo kha nang nhan membership cua channel.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): channelId
- Body:
  - `action` (`close` | `open`, bat buoc)
- Ghi chu:
  - Neu thieu role hoac role khac `admin` thi tra `FORBIDDEN` / HTTP 403 voi message `Admin role is required`.
  - API nay chi dong/mo van hanh membership sau khi da duyet; khong phai API approve/reject eligibility.
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `userId` (string)
    - `name` (string)
    - `bio` (string)
    - `isEligibleForMembership` (boolean)
    - `isMembershipClosedByAdmin` (boolean)
    - `membershipReviewStatus` (`not_requested` | `pending` | `approved` | `rejected`)
    - `membershipRejectionReason` (string | null)
    - `membershipRequestedAt` (string ISO | null)
    - `membershipReviewedAt` (string ISO | null)

### 2.7 PATCH `/api/media/memberships/:membershipId/auto-renew`

- Muc dich: user bat/tat tu dong gia han membership cua minh.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `membershipId` (string): id cua membership record, khong phai tier id.
- Body:

```json
{
  "enabled": true
}
```

- Ghi chu:
  - Chi owner cua membership moi duoc cap nhat.
  - Khi user tat auto-renew, membership hien tai van giu quyen truy cap den `expiryDate`.
  - Membership moi/gia han thanh cong se bat auto-renew mac dinh.
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `userId` (string)
    - `channelId` (string)
    - `membershipId` (string): tier id dang gan voi membership
    - `expiryDate` (string ISO | null)
    - `retryCount` (number)
    - `status` (`active` | `cancelled`)
    - `autoRenewEnabled` (boolean)
    - `renewalStatus` (`idle` | `pending` | `retrying` | `disabled`)
    - `renewalReminderSentAt` (string ISO | null)
    - `lastRenewalAttemptAt` (string ISO | null)
    - `nextRenewalAttemptAt` (string ISO | null)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

## 3. MEMBERSHIP TIER APIs

### 3.1 GET `/api/media/channels/:channelId/membership-tiers?page=1&limit=20`

- Muc dich: lay danh sach tier cua channel.
- Header:
  - `x-internal-secret`: He thong tu set
- Path param:
  - `channelId` (string)
- Query:
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `channelId` (string)
    - `name` (string)
    - `level` (number)
    - `priceCoin` (number)
    - `isAcceptingNew` (boolean)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 3.2 GET `/api/media/channels/:channelId/membership-tiers/:tierId`

- Muc dich: lay chi tiet 1 tier.
- Header:
  - `x-internal-secret`: He thong tu set
- Path param:
  - `channelId` (string)
  - `tierId` (string)
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `channelId` (string)
    - `name` (string)
    - `level` (number)
    - `priceCoin` (number)
    - `isAcceptingNew` (boolean)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

### 3.3 POST `/api/media/channels/:channelId/membership-review-requests`

- Muc dich: creator gui yeu cau admin duyet quyen mo membership cho channel.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `channelId` (string)
- Body: khong co body.
- Ghi chu:
  - API nay la luong chinh de xin admin mo membership, thay vi tao tier de trigger review.
  - Channel phai thuoc user hien tai va co `status = active`.
  - Neu admin dang dong membership cua channel thi tra HTTP 403.
  - Backend se sync eligibility theo nguong video/view hien tai.
  - Neu chua du dieu kien thi tra HTTP 403 kem `missingRequirements`.
  - Neu du dieu kien thi set `isEligibleForMembership = true`, `membershipReviewStatus = pending`, `membershipRequestedAt = now`.
  - Neu channel dang `pending` hoac da `approved`, API tra ve trang thai hien tai va khong reset review.
  - Neu channel bi `rejected`, creator co the goi lai API nay sau khi cai thien dieu kien/noi dung de dua ve `pending`.
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `userId` (string)
    - `name` (string)
    - `bio` (string)
    - `isEligibleForMembership` (boolean)
    - `isMembershipClosedByAdmin` (boolean)
    - `membershipReviewStatus` (`not_requested` | `pending` | `approved` | `rejected`)
    - `membershipRejectionReason` (string | null)
    - `membershipRequestedAt` (string ISO | null)
    - `membershipReviewedAt` (string ISO | null)
    - `avatarUrl` (string)
    - `bannerUrl` (string)
    - `status` (string)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

### 3.4 POST `/api/media/channels/:channelId/membership-tiers`

- Muc dich: tao tier moi cho channel.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `channelId` (string)
- Body:
  - `level` (1 | 2 | 3, bat buoc)
  - `name` (string, bat buoc, max 50)
  - `priceCoin` (number, bat buoc, min 0)
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Ghi chu:
  - Channel phai du nguong eligibility va duoc admin approve membership (`membershipReviewStatus = approved`) moi duoc tao tier.
  - Creator nen goi `POST /api/media/channels/:channelId/membership-review-requests` de xin admin duyet truoc khi tao tier.
  - Neu channel chua duoc approve, API nay tra HTTP 403 va khong tao tier.
- Response HTTP 201:
  - Envelope `data`:
    - `id` (string)
    - `channelId` (string)
    - `name` (string)
    - `level` (number)
    - `priceCoin` (number)
    - `isAcceptingNew` (boolean)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

### 3.5 PATCH `/api/media/channels/:channelId/membership-tiers/:tierId`

- Muc dich: cap nhat tier.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `channelId` (string)
  - `tierId` (string)
- Body:
  - `name` (string, optional, max 50)
  - `priceCoin` (number, optional, min 0)
  - `isAcceptingNew` (boolean, optional)
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `channelId` (string)
    - `name` (string)
    - `level` (number)
    - `priceCoin` (number)
    - `isAcceptingNew` (boolean)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

### 3.5 DELETE `/api/media/channels/:channelId/membership-tiers/:tierId`

- Muc dich: disable tier.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `channelId` (string)
  - `tierId` (string)
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `channelId` (string)
    - `name` (string)
    - `level` (number)
    - `priceCoin` (number)
    - `isAcceptingNew` (boolean)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

### 3.6 POST `/api/media/channels/:channelId/memberships/:tierId/purchase`

- Muc dich: user mua membership tier cua channel. Client khong gui gia tien hay
  owner; media-service tu lay tier/channel authoritative roi goi finance-service
  internal charge API.
- Headers:
  - `x-user-id` bat buoc
- Input:
  - path param `channelId`
  - path param `tierId`
- Backend xu ly:
  - check channel active, membership da duoc admin approve va khong bi admin dong
  - check tier thuoc channel va dang `isAcceptingNew`
  - check user khong phai owner channel va chua co membership active
  - charge finance qua `POST /api/internal/payments/charge` voi
    `serviceType=membership`
  - tao membership sync sau khi charge thanh cong; van consume
    `membership.payment.success` de reconcile idempotent
- Output `data`:

```json
{
  "membership": {
    "id": "membership-record-id",
    "userId": "user-1",
    "channelId": "channel-1",
    "membershipId": "tier-1",
    "expiryDate": "2026-06-01T00:00:00.000Z",
    "retryCount": 0,
    "status": "active",
    "autoRenewEnabled": true,
    "renewalStatus": "idle",
    "renewalReminderSentAt": null,
    "lastRenewalAttemptAt": null,
    "nextRenewalAttemptAt": null,
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-01T00:00:00.000Z"
  },
  "chargedCoinAmount": 100,
  "paymentTransactionId": "txn-id"
}
```

## 4. VIDEO APIs

### Thumbnail fields

Nhung response video list/detail chinh co cac field thumbnail:

- `thumbnailUrl` (string | null): URL MinIO public co dinh neu anh da san sang; khong can presigned GET URL.
- `thumbnailSource` (`auto` | `custom`): nguon thumbnail dang active.
- `thumbnailStatus` (`pending` | `processing` | `ready` | `failed`): trang thai thumbnail.

Frontend nen render `thumbnailUrl` khi `thumbnailStatus = ready`; cac trang thai khac dung placeholder.
Public/list/metadata/studio response deu tra URL public truc tiep trong `thumbnailUrl`. Media API khong con endpoint rieng de stream thumbnail cu; frontend dung truc tiep `thumbnailUrl`.

### Internal media APIs

- Cac endpoint `/api/media/internal/*` khong phai public gateway contract.
- Caller phai gui:
  - `x-internal-service`
  - `x-internal-service-secret`
- Caller phai nam trong `MEDIA_INTERNAL_SERVICE_ALLOWLIST`.
- Secret env theo format `<CALLER_SERVICE>_MEDIA_INTERNAL_SECRET`.

### GET `/api/media/internal/health`

- Muc dich: internal caller verify credential va connectivity toi media-service.
- Output `data`:

```json
{
  "service": "media-service",
  "status": "ok"
}
```

### 4.0 GET `/api/media/studio/videos?page=1&limit=20&status=draft,processing&visibility=private`

- Muc dich: lay danh sach video Studio cua chinh creator hien tai, gom ca draft/private/trang thai xu ly.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Query:
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
  - `status` (string, optional): danh sach status phan tach bang dau phay. Gia tri hop le: `draft`, `pending_moderation`, `processing`, `pending_manual_review`, `rejected`, `ready`, `failed`
  - `visibility` (string, optional): danh sach visibility phan tach bang dau phay. Gia tri hop le: `public`, `private`
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Ghi chu:
  - Endpoint nay chi tra video owner hien tai.
  - Ho tro offset pagination bang `page` + `limit`.
  - Gia tri `status`/`visibility` khong hop le se bi bo qua khi parse.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `channelId` (string)
    - `title` (string)
    - `description` (string)
    - `category` (string)
    - `tags` (string[])
    - `status` (string)
    - `visibility` (string)
    - `price` (number)
    - `requiredTierLevel` (number | null)
    - `thumbnailUrl` (string | null)
    - `thumbnailSource` (string)
    - `thumbnailStatus` (string)
    - `durationSeconds` (number | null)
    - `resolutions` (string[])
    - `errorMessage` (string | null)
    - `jobStatus` (string)
    - `jobStatusMessage` (string)
    - `failureReason` (string | null)
    - `moderationDetails` (object | null)
    - `viewCount` (number)
    - `publishedAt` (string ISO | null)
    - `isDeleted` (boolean)
    - `deletedAt` (string ISO | null)
    - `deletedBy` (string | null)
    - `deleteReason` (string | null)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 4.0B GET `/api/media/studio/videos/:id`

- Muc dich: lay chi tiet video Studio cua chinh creator hien tai theo `id`, gom ca `draft`, `private`, `pending_moderation`, `processing`, `pending_manual_review`, `rejected`, `failed`, `ready`.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path:
  - `id` (string): video id
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Ghi chu:
  - Endpoint nay chi tra video owner hien tai.
  - Neu video khong ton tai tra `NOT_FOUND` / HTTP 404.
  - Neu video thuoc owner khac tra `FORBIDDEN` / HTTP 403.
  - Dung endpoint nay cho man hinh Studio/detail quan ly video. Khong dung `GET /api/media/videos/:id/metadata` cho video chua public-ready, vi metadata endpoint chi expose video `ready + public + active`.
  - Neu response co `status = draft`, FE co the cho user resume/submit/cancel bang multipart upload lifecycle.
- Response HTTP 200:
  - Envelope `data`: object cung shape voi item cua `GET /api/media/studio/videos`, gom `status`, `jobStatus`, `jobStatusMessage`, `failureReason`, `moderationDetails`, thumbnail fields, delete fields va timestamps.

### 4.0A GET `/api/media/videos?q=...&category=...&tags=tag1,tag2&page=1&limit=20`

- Muc dich: tim kiem/list public videos truc tiep tu video controller.
- Public API: khong can `x-internal-secret`.
- Query:
  - `q` (string, optional): keyword search.
  - `category` (string, optional): category slug.
  - `tags` (string, optional): danh sach tag slug/name phan tach bang dau phay; backend trim, bo rong, va unique.
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- Ghi chu:
  - Endpoint nay chi tra public videos co the expose cho discovery.
  - Khac voi `GET /api/media/search`: endpoint nay chi tra videos, khong tra channels.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `channelId` (string)
    - `channelName` (string | null)
    - `title` (string)
    - `description` (string)
    - `category` (string)
    - `tags` (string[])
    - `status` (string)
    - `price` (number)
    - `requiredTierLevel` (number | null)
    - `thumbnailUrl` (string | null)
    - `thumbnailSource` (string)
    - `thumbnailStatus` (string)
    - `durationSeconds` (number | null)
    - `resolutions` (string[])
    - `errorMessage` (string | null)
    - `viewCount` (number)
    - `publishedAt` (string ISO | null)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 4.1 POST `/api/media/studio/videos/uploads`

- Muc dich: tao video draft va bat dau resumable multipart upload cho raw video.
- Day la API upload chinh cho FE/mobile. User van chon 1 file video hoan chinh; client tu chia file thanh cac part nho va upload truc tiep len MinIO bang presigned URL.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Body:
  - `title` (string, bat buoc, max 200)
  - `description` (string, optional, default `""`)
  - `categoryId` (string, bat buoc): ID cua category chinh, category phai ton tai va dang `active`
  - `tagIds` (string[], optional, default `[]`): danh sach tag ID, unique, tat ca tag phai ton tai va dang `active`
  - `visibility` (`public` | `private`, optional, default `public`)
  - `price` (number, optional, default 0, min 0)
  - `requiredTierLevel` (number | null, optional, min 1)
  - `fileName` (string, bat buoc): ten file goc tren client
  - `fileSize` (number, bat buoc, min 1): kich thuoc file byte
  - `fileLastModified` (string ISO, bat buoc): thoi diem file duoc sua tren client
  - `thumbnailExtension` (`jpg` | `jpeg` | `png` | `webp`, optional): neu creator muon upload custom thumbnail, backend se tra them presigned PUT URL rieng cho thumbnail.
- Ghi chu:
  - Backend tao draft video voi `status = draft`.
  - Backend tao MinIO multipart upload session va luu `uploadId`, `partSizeBytes`, file metadata, expiry trong DB.
  - `partSizeBytes` mac dinh hien tai la 16MB.
  - Backend validate `fileSize > 0` va khong vuot gioi han upload.
  - Neu co `thumbnailExtension`, client upload anh custom thumbnail vao `thumbnailUploadUrl` truoc khi goi submit.
  - Custom thumbnail duoc upload vao `MINIO_PUBLIC_BUCKET`; sau submit response/list se tra URL public co dinh trong `thumbnailUrl`.
  - Neu khong co `thumbnailExtension`, he thong se auto-generate thumbnail bang Media Processing Service sau moderation/transcode.
- Response HTTP 201:
  - Envelope `data`:
    - `videoId` (string)
    - `status` (string)
    - `rawFileKey` (string)
    - `bucket` (string)
    - `uploadId` (string): MinIO multipart upload session id
    - `partSizeBytes` (number): kich thuoc moi part client nen cat bang `Blob.slice`
    - `expiresAt` (string ISO): thoi diem upload session het han
    - `thumbnailObjectKey` (string | null)
    - `thumbnailBucket` (string | null): bucket public, vi du `media-public`, neu co custom thumbnail
    - `thumbnailUploadUrl` (string | null): presigned PUT URL de upload custom thumbnail; khong dung URL nay de render anh
- Vi du response:

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "videoId": "video-123",
    "status": "draft",
    "rawFileKey": "uploads/raw/channel-1/1710000000000-uuid.mp4",
    "bucket": "media-raw",
    "uploadId": "minio-upload-id",
    "partSizeBytes": 16777216,
    "expiresAt": "2026-05-21T10:00:00.000Z",
    "thumbnailObjectKey": null,
    "thumbnailBucket": null,
    "thumbnailUploadUrl": null
  }
}
```

### 4.2 POST `/api/media/studio/videos/:videoId/uploads/:uploadId/part-urls`

- Muc dich: xin presigned URL de upload mot hoac nhieu part cua video.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `videoId` (string)
  - `uploadId` (string)
- Body:
  - `partNumbers` (number[], bat buoc): danh sach part can upload hoac can xin lai URL
- Ghi chu:
  - Chi owner duoc xin URL.
  - Video phai con `status = draft`.
  - `uploadId` phai thuoc dung `videoId`.
  - `partNumber` bat dau tu 1 va khong duoc vuot tong so part tinh tu `fileSize / partSizeBytes`.
  - Presigned URL co the het han; FE chi can goi lai endpoint nay voi cac part chua xong.
- Response HTTP 200:
  - Envelope `data.parts[]`:
    - `partNumber` (number)
    - `uploadUrl` (string)
    - `expiresAt` (string ISO)

### 4.3 POST `/api/media/studio/videos/:videoId/uploads/:uploadId/parts/:partNumber/completed`

- Muc dich: bao cho backend biet mot part da upload thanh cong len MinIO.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `videoId` (string)
  - `uploadId` (string)
  - `partNumber` (number)
- Body:
  - `etag` (string, bat buoc): gia tri `ETag` tra ve tu MinIO sau khi upload part thanh cong
  - `sizeBytes` (number, bat buoc): kich thuoc part da upload
- Ghi chu:
  - Endpoint nay chi luu trang thai part trong DB, khong ghep file.
  - Neu client retry va gui lai cung `partNumber`, backend cap nhat `etag` moi.
- Response HTTP 200:
  - Envelope `data`:
    - `videoId` (string)
    - `uploadId` (string)
    - `partNumber` (number)
    - `completed` (boolean)

### 4.4 GET `/api/media/studio/videos/:videoId/uploads/:uploadId/status`

- Muc dich: lay upload session va danh sach part da hoan thanh de resume khi mat mang hoac reload app.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Response HTTP 200:
  - Envelope `data`:
    - `videoId` (string)
    - `uploadId` (string)
    - `rawFileKey` (string)
    - `partSizeBytes` (number)
    - `fileName` (string)
    - `fileSize` (number)
    - `fileLastModified` (string ISO)
    - `status` (`active`)
    - `expiresAt` (string ISO)
    - `parts` (array): cac part da upload thanh cong, moi item co `partNumber`, `etag`, `sizeBytes`, `uploadedAt`
- Cach resume:
  - FE tinh tong part tu `fileSize` va `partSizeBytes`.
  - FE bo qua cac `partNumber` da co trong `parts`.
  - FE goi `part-urls` cho cac part con thieu va upload tiep.

### 4.5 POST `/api/media/studio/videos/:videoId/uploads/:uploadId/complete`

- Muc dich: yeu cau backend hoan tat MinIO multipart upload, ghep cac part thanh 1 raw object hoan chinh.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Request:
  - Khong co body.
- Ghi chu:
  - Backend kiem tra du tat ca part theo `fileSize / partSizeBytes`.
  - Backend sort parts tang dan theo `partNumber` va goi MinIO complete multipart.
  - Sau khi thanh cong, raw object ton tai tai `rawFileKey`.
- Response HTTP 200:
  - Envelope `data`:
    - `videoId` (string)
    - `uploadId` (string)
    - `rawFileKey` (string)
    - `completed` (boolean)

### 4.6 POST `/api/media/studio/videos/:videoId/uploads/:uploadId/submit`

- Muc dich: submit video da upload xong vao moderation/processing pipeline.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Body:
  - `resolutions` (string[], bat buoc, unique, 1-3 phan tu)
  - Gia tri hop le hien tai: `480p`, `720p`, `1080p`
  - `thumbnailObjectKey` (string, optional): object key custom thumbnail da upload bang URL tra ve tu `POST /videos/uploads`
- Ghi chu:
  - Endpoint nay dung lai logic confirm upload hien tai.
  - Backend kiem tra raw object ton tai, size > 0, va khong vuot gioi han upload.
  - Neu co custom thumbnail, backend kiem tra object trong `MINIO_PUBLIC_BUCKET`, set `thumbnailUrl` la URL public co dinh.
  - Khi submit thanh cong, backend copy raw object sang immutable key `uploads/confirmed/{videoId}/{uuid}.mp4`, set thumbnail state, chuyen video sang `pending_moderation`, va publish moderation event.
- Response HTTP 201:
  - Envelope `data`:
    - `status` (string)
    - `message` (string)

### 4.7 DELETE `/api/media/studio/videos/:videoId/uploads/:uploadId`

- Muc dich: huy multipart upload session va xoa video draft khi user khong muon upload nua.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Ghi chu:
  - Chi owner duoc cancel.
  - Chi cancel duoc khi video con `status = draft`.
  - Backend abort MinIO multipart upload neu session con active, xoa raw object neu ton tai, va hard delete video draft trong DB.
- Response HTTP 200:
  - Envelope `data`:
    - `videoId` (string)
    - `cancelled` (boolean)

### 4.8 DELETE `/api/media/studio/videos/:id/failed-upload`

- Muc dich: xoa video upload/xu ly that bai khoi studio cua owner.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): videoId
- Request:
  - Khong co body.
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Ghi chu:
  - Chi owner duoc xoa.
  - Chi dung cho video o trang thai failed theo rule cua use case.
- Response HTTP 200:
  - Envelope `data`:
    - `videoId` (string)
    - `deleted` (boolean)

### 4.9 DELETE `/api/media/studio/videos/:id`

- Muc dich: unpublish/xoa mem video cua owner.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): videoId
- Request:
  - Khong co body.
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Ghi chu:
  - Chi owner duoc thuc hien.
  - Endpoint nay khong hard delete file ngay lap tuc; use case tra ket qua unpublish/delete theo rule hien tai.
- Response HTTP 200:
  - Envelope `data`:
    - `videoId` (string)
    - `unpublished` (boolean)

### 4.7 GET `/api/media/me/videos/:id/play`

- Muc dich: lay thong tin phat video cho user hien tai.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): videoId
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Response HTTP 200:
  - Envelope `data`:
    - `videoId` (string)
    - `title` (string)
    - `description` (string)
    - `playbackToken` (string)
    - `playbackUrl` (string)
    - `resumePositionSeconds` (number): vi tri tiep tuc xem, `0` neu chua co tien do
    - `isResumeAvailable` (boolean): `true` neu co the xem tiep tu tien do da luu

### 4.8 POST `/api/media/me/videos/:id/progress`

- Muc dich: luu tien do xem video cua user hien tai.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): videoId
- Body:
  - `positionSeconds` (number, bat buoc, min 0)
  - `durationSeconds` (number | null, optional, min 0)
  - `state` (`watching` | `paused` | `completed`, optional)
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Response HTTP 200:
  - Envelope `data`:
    - `videoId` (string)
    - `positionSeconds` (number)
    - `completed` (boolean)

### 4.9 POST `/api/media/me/videos/:id/playback-token/refresh`

- Muc dich: cap moi playback token cho video dang xem.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): videoId
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Response HTTP 200:
  - Envelope `data`:
    - `videoId` (string)
    - `playbackToken` (string)
    - `playbackUrl` (string)

### 4.10 GET `/api/media/videos/:id/metadata`

- Muc dich: lay metadata public cua video.
- Public API: khong can `x-internal-secret`.
- Path param:
  - `id` (string): videoId
- Ghi chu:
  - Chi tra video public/phu hop quy tac public trong use case.
  - Neu video khong ton tai hoac khong duoc expose thi tra `NOT_FOUND` / HTTP 404.
  - `categoryId` va `tagIds` dung de FE preselect form edit video.
  - `category` luon la category slug; `tags` luon la tag slug array, dung cho display/filter.
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `channelId` (string)
    - `channelName` (string)
    - `avatarUrlChannel` (string)
    - `membershipTiers` (array)
      - `id` (string)
      - `channelId` (string)
      - `name` (string)
      - `level` (number)
      - `priceCoin` (number)
      - `isAcceptingNew` (boolean)
      - `createdAt` (string ISO)
      - `updatedAt` (string ISO)
    - `title` (string)
    - `description` (string)
    - `categoryId` (string): id cua category chinh hien tai
    - `category` (string): category slug
    - `tagIds` (string[]): danh sach tag id hien tai
    - `tags` (string[]): danh sach tag slug hien tai
    - `thumbnailUrl` (string | null)
    - `thumbnailSource` (string)
    - `thumbnailStatus` (string)
    - `viewCount` (number)
    - `price` (number): gia mua le, `0` neu free
    - `requiredTierLevel` (number | null): tier membership toi thieu neu video khoa theo membership
    - `status` (string)
    - `visibility` (string)
    - `errorMessage` (string | null)
    - `jobStatus` (string)
    - `jobStatusMessage` (string)
    - `failureReason` (string | null)
    - `moderationDetails` (object | null)
    - `publishedAt` (string ISO | null)
    - `isDeleted` (boolean)
    - `deletedAt` (string ISO | null)
    - `deletedBy` (string | null)
    - `deleteReason` (string | null)
    - `updatedAt` (string ISO)

### 4.11 PATCH `/api/media/studio/videos/:id/metadata`

- Muc dich: creator cap nhat metadata cua video.
- Header:
  - `x-user-id`: Gateway verify JWT roi tu set
  - `x-internal-secret`: Gateway/service noi bo tu set, client khong tu gui
- Path param:
  - `id` (string): videoId
- Body:
  - `title` (string, optional, max 200)
  - `description` (string, optional)
  - `thumbnailUrl` (string | null, optional, max 500)
  - `categoryId` (string, optional): neu truyen thi category phai ton tai va dang `active`
  - `tagIds` (string[], optional): neu truyen thi replace toan bo tag hien tai; unique va tat ca tag phai dang `active`
  - `visibility` (`public` | `private`, optional): cap nhat trang thai hien thi video cua owner
- Ghi chu:
  - Chi owner duoc sua; non-owner tra `FORBIDDEN` / HTTP 403.
  - Response tra ca id va slug: FE nen dung `categoryId/tagIds` de set value edit form, va dung `category/tags` nhu slug cho display/filter.
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `channelId` (string)
    - `channelName` (string)
    - `avatarUrlChannel` (string)
    - `membershipTiers` (array)
      - `id` (string)
      - `channelId` (string)
      - `name` (string)
      - `level` (number)
      - `priceCoin` (number)
      - `isAcceptingNew` (boolean)
      - `createdAt` (string ISO)
      - `updatedAt` (string ISO)
    - `title` (string)
    - `description` (string)
    - `categoryId` (string): id cua category chinh sau update
    - `category` (string): category slug sau update
    - `tagIds` (string[]): danh sach tag id sau update
    - `tags` (string[]): danh sach tag slug sau update
    - `thumbnailUrl` (string | null)
    - `thumbnailSource` (string)
    - `thumbnailStatus` (string)
    - `viewCount` (number)
    - `status` (string)
    - `visibility` (string)
    - `errorMessage` (string | null)
    - `jobStatus` (string)
    - `jobStatusMessage` (string)
    - `failureReason` (string | null)
    - `moderationDetails` (object | null)
    - `publishedAt` (string ISO | null)
    - `isDeleted` (boolean)
    - `deletedAt` (string ISO | null)
    - `deletedBy` (string | null)
    - `deleteReason` (string | null)
    - `updatedAt` (string ISO)

### 4.12 GET `/api/media/videos/latest?page=1&limit=20`

- Muc dich: lay danh sach video moi nhat.
- Public API: khong can `x-internal-secret`.
- Query:
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- He thong tu set them khi xu ly:
  - Neu thieu `page` thi he thong dung `1`
  - Neu thieu `limit` thi he thong dung `20`
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `channelId` (string)
    - `channelName` (string | null)
    - `title` (string)
    - `description` (string)
    - `category` (string)
    - `tags` (string[])
    - `status` (string)
    - `price` (number)
    - `requiredTierLevel` (number | null)
    - `thumbnailUrl` (string | null)
    - `thumbnailSource` (string)
    - `thumbnailStatus` (string)
    - `durationSeconds` (number | null)
    - `resolutions` (string[])
    - `errorMessage` (string | null)
    - `viewCount` (number)
    - `publishedAt` (string ISO | null)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 4.12A GET `/api/media/videos/ranking?metric=views&period=day&page=1&limit=20`

- Muc dich: lay danh sach video public xep hang theo luot xem hoac luot mua trong khoang thoi gian.
- Public API: khong can `x-internal-secret`.
- Query:
  - `metric` (bat buoc): `views` hoac `purchases`.
  - `period` (bat buoc): `day`, `week`, hoac `month`.
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- Ghi chu:
  - `period=day` tinh tu dau ngay UTC hien tai.
  - `period=week` la rolling 7 ngay gan nhat tinh tu dau ngay UTC hien tai.
  - `period=month` la rolling 30 ngay gan nhat tinh tu dau ngay UTC hien tai.
  - `metric=purchases` lay du lieu tu `video_purchase_unlocks.created_at`.
  - `metric=views` lay du lieu tu bang aggregate `video_view_daily_stats`; chi chinh xac cho cac view duoc ghi sau migration tao bang nay.
  - Chi tra video `ready + public`, channel `active`, video chua bi delete.
  - Sap xep theo `metricCount DESC`, fallback `publishedAt DESC`, `createdAt DESC`.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom cac field nhu `GET /api/media/videos/latest` va them:
    - `metricCount` (number): so luot xem/luot mua trong period dang query.
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 4.13 GET `/api/media/me/videos/purchased?page=1&limit=20`

- Muc dich: lay thu vien video da mua/unlock cua user hien tai.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Query:
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Ghi chu:
  - Du lieu den tu bang `video_purchase_unlocks`, duoc tao sync khi user goi
    `POST /api/media/videos/:id/purchase`; event `video.payment.success` van
    duoc consume de retry/reconcile idempotent.
  - Endpoint nay chi list video user da unlock/mua le, khong phai membership feed.
  - Sap xep theo lan unlock moi nhat truoc.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `videoId` (string)
    - `channelId` (string)
    - `channelName` (string | null)
    - `title` (string)
    - `description` (string)
    - `categories` (string[])
    - `tags` (string[])
    - `thumbnailUrl` (string | null)
    - `durationSeconds` (number | null)
    - `priceCoin` (number)
    - `purchasedAt` (string ISO)
    - `viewCount` (number)
    - `publishedAt` (string ISO | null)
    - `accessStatus` (`ACTIVE`)
  - Envelope `pagination`:
    - `page` (number)
    - `limit` (number)
    - `total` (number)
    - `totalPages` (number)

### 4.14 POST `/api/media/videos/:id/purchase`

- Muc dich: user mua le video tinh phi. Client khong gui gia tien hay owner;
  media-service tu lay video authoritative roi goi finance-service internal
  charge API.
- Headers:
  - `x-user-id` bat buoc
- Input:
  - path param `id`: video id
- Backend xu ly:
  - check video ton tai, `status=ready`, `visibility=public`, chua pending delete
  - check video co `price > 0`
  - check user khong phai owner video
  - neu user da unlock video thi tra ve `unlocked=true` va khong charge lai
  - charge finance qua `POST /api/internal/payments/charge` voi
    `serviceType=video`
  - tao unlock sync sau khi charge thanh cong; van consume `video.payment.success`
    de reconcile idempotent
- Output `data`:

```json
{
  "videoId": "video-1",
  "channelId": "channel-1",
  "priceCoin": 100,
  "unlocked": true,
  "paymentTransactionId": "txn-id"
}
```

### 4.15 GET `/api/media/videos/by-category?category=...&page=1&limit=20`

- Muc dich: lay danh sach video theo category.
- Public API: khong can `x-internal-secret`.
- Query:
  - `category` (string, bat buoc)
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- He thong tu set them khi xu ly:
  - Neu thieu `page` thi he thong dung `1`
  - Neu thieu `limit` thi he thong dung `20`
- Ghi chu:
  - `category` duoc lookup theo `slug`.
  - Neu `category` rong sau khi trim thi tra `BAD_REQUEST` / HTTP 400.
  - Neu `category` khong ton tai hoac khong `active` thi tra `NOT_FOUND` / HTTP 404.
  - Danh sach video duoc sap xep mac dinh theo `publishedAt DESC`, fallback `createdAt DESC`.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `channelId` (string)
    - `channelName` (string | null)
    - `title` (string)
    - `description` (string)
    - `category` (string)
    - `tags` (string[])
    - `status` (string)
    - `price` (number)
    - `requiredTierLevel` (number | null)
    - `thumbnailUrl` (string | null)
    - `thumbnailSource` (string)
    - `thumbnailStatus` (string)
    - `durationSeconds` (number | null)
    - `resolutions` (string[])
    - `errorMessage` (string | null)
    - `viewCount` (number)
    - `publishedAt` (string ISO | null)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)
  - Envelope `pagination`:
    - `page` (number)
    - `limit` (number)
    - `total` (number)
    - `totalPages` (number)

### 4.16 GET `/api/media/me/videos/subscribed?page=1&limit=20`

- Muc dich: lay video public moi tu cac channel ma user dang co membership active.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Query:
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
  - Neu thieu `page` thi he thong dung `1`
  - Neu thieu `limit` thi he thong dung `20`
- Ghi chu:
  - Endpoint nay phuc vu discovery/feed, co the dung cho section "Video moi tu kenh ban theo doi".
  - Hien tai semantics la membership-only: nguon channel duoc suy ra tu active memberships, khong phai follow mien phi doc lap.
  - Khong duoc dung endpoint nay de thay the `GET /api/media/memberships/me`.
  - Response KHONG bao gom tier, expiryDate, canRenew, canUpgrade, hoac bat ky metadata membership nao.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `channelId` (string)
    - `channelName` (string | null)
    - `title` (string)
    - `description` (string)
    - `category` (string)
    - `tags` (string[])
    - `status` (string)
    - `price` (number)
    - `requiredTierLevel` (number | null)
    - `thumbnailUrl` (string | null)
    - `thumbnailSource` (string)
    - `thumbnailStatus` (string)
    - `durationSeconds` (number | null)
    - `resolutions` (string[])
    - `errorMessage` (string | null)
    - `viewCount` (number)
    - `publishedAt` (string ISO | null)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 4.17 GET `/api/media/me/videos/continue-watching?page=1&limit=20`

- Muc dich: lay danh sach video user dang xem do de hien thi muc xem tiep.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Query:
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
  - Neu thieu `page` thi he thong dung `1`
  - Neu thieu `limit` thi he thong dung `20`
- Ghi chu:
  - Chi lay cac ban ghi co progress chua hoan tat.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `videoId` (string)
    - `channelId` (string)
    - `title` (string)
    - `thumbnailUrl` (string | null)
    - `durationSeconds` (number | null)
    - `resumePositionSeconds` (number)
    - `remainingSeconds` (number | null)
    - `lastWatchedAt` (string ISO)
    - `viewCount` (number)
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 4.18 POST `/api/media/videos/:id/reports`

- Muc dich: user report video vi pham.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Body:

```json
{
  "reason": "Noi dung vi pham chinh sach",
  "evidenceTimestampSeconds": 42
}
```

- Validation:
  - `reason` bat buoc, khong rong, toi da 1000 ky tu.
  - `evidenceTimestampSeconds` optional, integer >= 0.
  - Neu video co duration thi `evidenceTimestampSeconds` khong duoc lon hon duration.
- Response HTTP 201:
  - Envelope `data`: content report vua tao, hoac pending report hien co neu user da report cung video va report do chua duoc xu ly.

### 4.19 POST `/api/media/channels/:id/reports`

- Muc dich: user report channel vi pham.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Body voi video id chinh xac:

```json
{
  "reason": "Channel dang dang noi dung vi pham",
  "reportedVideoId": "video-1"
}
```

- Body voi ten video free-text:

```json
{
  "reason": "Channel dang dang noi dung vi pham",
  "reportedVideoTitle": "Ten video user thay vi pham"
}
```

- Validation:
  - `reason` bat buoc, khong rong, toi da 1000 ky tu.
  - Neu co `reportedVideoId`, video phai ton tai va thuoc channel dang report.
  - Neu co ca `reportedVideoId` va `reportedVideoTitle`, server uu tien `reportedVideoId` va snapshot title tu video that.
- Response HTTP 201:
  - Envelope `data`: content report vua tao, hoac pending report hien co neu user da report cung channel va report do chua duoc xu ly.

## 5. SEARCH APIs

### 5.1 GET `/api/media/search?q=...&category=...&page=1&limit=20`

- Muc dich: tim kiem tong hop public videos va channels.
- Public API: khong can `x-internal-secret`.
- Query:
  - `q` (string, optional, max 200): keyword tim kiem. Match:
    - video: `title`, `description`
    - channel: `name`, `bio`
  - `category` (string, optional, max 100): category slug. Input duoc normalize ve slug.
  - `page` (number, optional, default 1, min 1): ap dung cho danh sach `videos`.
  - `limit` (number, optional, default 20, min 1, max 50)
- Quy tac:
  - Bat buoc phai co it nhat mot trong `q` hoac `category`, neu khong tra `BAD_REQUEST` / HTTP 400.
  - `q` va `category` rong sau khi trim se duoc normalize thanh `undefined`.
  - Neu chi co `category`, service chi tra `videos`, con `channels = []`.
  - Neu co ca `q` va `category`, `videos` bi loc theo ca keyword va category; `channels` chi search theo `q`.
  - Chi expose:
    - videos co `status = ready` va `visibility = public`
    - channels co `status = active`
- Response HTTP 200:
  - Envelope `data`:
    - `videos` (array), moi object giong shape cua `GET /api/media/videos/latest`
    - `channels` (array), moi object gom:
      - `id` (string)
      - `userId` (string)
      - `name` (string)
      - `bio` (string)
      - `avatarUrl` (string)
      - `bannerUrl` (string)
      - `status` (string)
      - `isEligibleForMembership` (boolean)
      - `createdAt` (string ISO)
      - `updatedAt` (string ISO)
    - `query` (object)
      - `q` (string | null)
      - `category` (string | null)
      - `page` (number)
      - `limit` (number)
  - Envelope `pagination`: pagination cua danh sach `videos` (`page`, `limit`, `total`, `totalPages`). `channels` van lay toi da `limit` item theo keyword, khong co total rieng.

## 6. STREAMING APIs

### 6.1 GET `/api/media/stream/:videoId/master.m3u8?token=...`

- Muc dich: lay file playlist HLS master.
- Public theo gateway guard:
  - Khong co `x-internal-secret`
  - Nhung bat buoc phai co playback `token`
- Path param:
  - `videoId` (string)
- Query:
  - `token` (string, bat buoc): He thong tu set tu API `GET /videos/:id/play` hoac refresh token
- Response HTTP 200:
  - Content-Type: `application/vnd.apple.mpegurl`
  - Body: noi dung text cua file m3u8

### 6.2 GET `/api/media/stream/:videoId/segments/:segmentName?token=...`

- Muc dich: lay segment video HLS.
- Public theo gateway guard:
  - Khong co `x-internal-secret`
  - Nhung bat buoc phai co playback `token`
- Path param:
  - `videoId` (string)
  - `segmentName` (string): player tu set theo playlist m3u8; backend se `decodeURIComponent` truoc khi xu ly
- Query:
  - `token` (string, bat buoc): He thong tu set tu API `GET /videos/:id/play` hoac refresh token
- Response HTTP 200:
  - `Content-Type`: phu thuoc vao segment thuc te (`segment.contentType`)
  - Body: binary stream hoac text segment

## 7. CATEGORY APIs

### 7.1 GET `/api/media/categories?q=...&page=1&limit=20`

- Muc dich: lay danh sach category public dang ACTIVE, co ho tro search.
- Public API: khong can `x-internal-secret`.
- Query:
  - `q` (string, optional): keyword search theo `name` hoac `slug`.
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- Ghi chu:
  - Endpoint nay chi tra category co `status = active`.
  - Neu khong truyen `q` thi tra tat ca category active.
  - Neu co `q`, backend trim keyword va search case-insensitive theo `name` hoac `slug`.
  - Neu `q` rong sau khi trim thi fallback ve danh sach tat ca category active.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `name` (string)
    - `slug` (string)
    - `description` (string | undefined)
    - `parentId` (string | null)
    - `status` (`active`)
    - `displayOrder` (number)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 7.2 GET `/api/media/admin/categories?q=...&page=1&limit=20`

- Muc dich: admin lay tat ca category hoac search category, gom ACTIVE, INACTIVE, DELETED.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Query:
  - `q` (string, optional): keyword search theo `name` hoac `slug`.
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- Ghi chu:
  - Neu thieu role hoac role khac `admin` thi tra `FORBIDDEN` / HTTP 403 voi message `Admin role is required`.
  - Neu khong truyen `q` thi tra tat ca category moi status.
  - Neu co `q`, backend trim keyword va search case-insensitive theo `name` hoac `slug`.
  - Admin search khong loc status, nen co the tra `active`, `inactive`, `deleted`.
  - Neu `q` rong sau khi trim thi fallback ve danh sach tat ca category moi status.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `name` (string)
    - `slug` (string)
    - `description` (string | undefined)
    - `parentId` (string | null)
    - `status` (`active` | `inactive` | `deleted`)
    - `displayOrder` (number)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 7.3 POST `/api/media/admin/categories`

- Muc dich: admin tao category moi.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Body:
  - `name` (string, bat buoc, max 100)
  - `description` (string, optional)
  - `parentId` (string | null, optional)
  - `displayOrder` (number, optional, min 0, default 0)
- Response HTTP 201:
  - Envelope `data`:
    - `id` (string)
    - `name` (string)
    - `slug` (string)
    - `description` (string | undefined)
    - `parentId` (string | null)
    - `status` (string)
    - `displayOrder` (number)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

### 7.4 PATCH `/api/media/admin/categories/:id`

- Muc dich: admin cap nhat category.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): categoryId
- Body:
  - `name` (string, optional, max 100)
  - `description` (string, optional)
  - `parentId` (string | null, optional)
  - `status` (`active` | `inactive` | `deleted`, optional)
  - `displayOrder` (number, optional, min 0)
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `name` (string)
    - `slug` (string)
    - `description` (string | undefined)
    - `parentId` (string | null)
    - `status` (string)
    - `displayOrder` (number)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

### 7.5 DELETE `/api/media/admin/categories/:id`

- Muc dich: admin xoa mem category bang cach chuyen `status` ve `inactive`.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): categoryId
- Response HTTP 200:
  - Envelope `data`: category sau khi inactive.

## 8. TAG APIs

### 8.1 GET `/api/media/tags?q=...&page=1&limit=20`

- Muc dich: lay danh sach tag public dang ACTIVE, co ho tro search.
- Public API: khong can `x-internal-secret`.
- Query:
  - `q` (string, optional): keyword search theo `name` hoac `slug`.
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `name` (string)
    - `slug` (string)
    - `status` (`active`)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 8.2 GET `/api/media/admin/tags?q=...&page=1&limit=20`

- Muc dich: admin lay tat ca tag hoac search tag, gom `active`, `inactive`, `pending`, `deleted`.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Query:
  - `q` (string, optional): keyword search theo `name` hoac `slug`.
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- Response HTTP 200:
  - Envelope `data`: array tag.
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 8.3 POST `/api/media/admin/tags`

- Muc dich: admin tao tag moi.
- Body:
  - `name` (string, bat buoc, max 100)
- Response HTTP 201:
  - Envelope `data`: tag vua tao.

### 8.4 PATCH `/api/media/admin/tags/:id`

- Muc dich: admin cap nhat tag.
- Body:
  - `name` (string, optional, max 100)
  - `status` (`active` | `inactive` | `pending` | `deleted`, optional)
- Response HTTP 200:
  - Envelope `data`: tag sau khi cap nhat.

### 8.5 DELETE `/api/media/admin/tags/:id`

- Muc dich: admin xoa mem tag bang cach chuyen `status` ve `inactive`.
- Response HTTP 200:
  - Envelope `data`: tag sau khi inactive.

## 9. ADMIN DASHBOARD APIs

### 9.1 GET `/api/media/admin/channels/summary`

- Muc dich: lay summary creator/channel cho admin dashboard.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Response HTTP 200:
  - Envelope `data`:
    - `totalChannels` (number): tong channel trong he thong
    - `activeCreators30d` (number): so channel co video tao trong 30 ngay gan nhat
    - `eligibleForMembership` (number): so channel du dieu kien membership
    - `membershipClosedByAdmin` (number): so channel bi admin dong membership
    - `membershipPendingReview` (number): so channel dang cho admin duyet membership
    - `membershipApproved` (number): so channel da duoc admin duyet membership
    - `membershipRejected` (number): so channel bi admin tu choi membership
    - `uploadingNow` (number): so video dang draft/pending_moderation/processing

### 9.2 GET `/api/media/admin/channels?page=1&limit=20&status=active&ownerId=...&q=...`

- Muc dich: admin list/search channel de quan tri lock/unlock hoac membership review.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Query:
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 100)
  - `status` optional: `active`, `inactive`, `suspended`
  - `ownerId` optional: loc theo owner/user id
  - `q` optional: search theo `name` hoac `bio`
- Response HTTP 200:
  - Envelope `data`:
    - `items` (array), moi object gom channel summary fields: `id`, `userId`, `name`, `bio`, `status`, membership review fields, avatar/banner, timestamps.
    - `pagination`: `page`, `limit`, `total`, `totalPages`

### 9.3 GET `/api/media/admin/channels/membership-reviews?status=pending&page=1&limit=20`

- Muc dich: admin lay danh sach channel theo trang thai duyet membership.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Query:
  - `status` (`pending` | `approved` | `rejected`, optional, default `pending`)
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- Ghi chu:
  - Channel vao danh sach `pending` khi creator goi `POST /api/media/channels/:id/membership-review-requests` va channel du dieu kien.
  - Neu thieu role hoac role khac `admin` thi tra `FORBIDDEN` / HTTP 403 voi message `Admin role is required`.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `channelId` (string)
    - `userId` (string)
    - `name` (string)
    - `status` (string)
    - `isEligibleForMembership` (boolean)
    - `isMembershipClosedByAdmin` (boolean)
    - `membershipReviewStatus` (`pending` | `approved` | `rejected`)
    - `membershipRejectionReason` (string | null)
    - `membershipRequestedAt` (string ISO | null)
    - `membershipReviewedAt` (string ISO | null)
    - `readyVideoCount` (number)
    - `minReadyVideoCount` (number)
    - `totalVideoViews` (number)
    - `minTotalVideoViews` (number)
  - Envelope `pagination`: `page`, `limit`, `total`, `totalPages`

### 9.4 PATCH `/api/media/admin/channels/:id/membership-review`

- Muc dich: admin approve/reject quyen mo membership cua channel.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): channelId
- Body approve:

```json
{
  "action": "approve"
}
```

- Body reject:

```json
{
  "action": "reject",
  "reason": "Policy issue"
}
```

- Ghi chu:
  - `reason` bat buoc khi `action = reject`.
  - Chi approve duoc channel da eligible va dang `pending` hoac `rejected`.
  - Chi reject duoc channel da eligible va dang `pending`.
  - Sau khi approve, creator moi duoc tao membership tier.
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `userId` (string)
    - `name` (string)
    - `bio` (string)
    - `isEligibleForMembership` (boolean)
    - `isMembershipClosedByAdmin` (boolean)
    - `membershipReviewStatus` (`not_requested` | `pending` | `approved` | `rejected`)
    - `membershipRejectionReason` (string | null)
    - `membershipRequestedAt` (string ISO | null)
    - `membershipReviewedAt` (string ISO | null)
    - `avatarUrl` (string)
    - `bannerUrl` (string)
    - `status` (string)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

### 9.5 PATCH `/api/media/admin/channels/:id/status`

- Muc dich: admin khoa/mo khoa channel bang cach chuyen status `suspended`/`active`.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): channelId
- Body lock:

```json
{
  "action": "lock",
  "reason": "DMCA violation"
}
```

- Body unlock:

```json
{
  "action": "unlock"
}
```

- Response HTTP 200:
  - Envelope `data`: channel sau khi cap nhat status.
- Side effects khi `action = lock`:
  - Channel chuyen sang `suspended`.
  - Creator mutations bi chan vi cac API creator yeu cau channel `active`.
  - Auto-renew cua membership hien tai tren channel bi disable.
  - Public discovery/search/latest/detail khong tra video cua channel suspended.
  - Publish event `channel.status.changed` cho finance-service dat payout hold.

### 9.6 GET `/api/media/admin/reports/summary`

- Muc dich: lay summary moderation queue cho admin dashboard, gom user-submitted reports va synthetic reports tu video auto-moderation queue.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Response HTTP 200:
  - Envelope `data`:
    - `pendingReports` (number): tong pending user reports + pending auto moderation reports
    - `pendingManualReviewVideos` (number): video status `pending_manual_review`
    - `autoFlaggedVideos` (number): video co `moderationDetails` va status pending/rejected
    - `rejectedLast30d` (number): video rejected trong 30 ngay gan nhat
    - `averageResolutionHours` (number | null): hien tai `null`
    - `pendingUserReports` (number)
    - `pendingVideoReports` (number)
    - `pendingChannelReports` (number)
    - `resolvedUserReports` (number)
    - `dismissedUserReports` (number)

### 9.7 GET `/api/media/admin/reports?status=pending&page=1&limit=5&source=user&targetType=video`

- Muc dich: lay danh sach moderation report/queue item cho dashboard.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Query:
  - `status` (`pending` | `resolved` | `dismissed` | `rejected`, optional, default `pending`)
  - `source` (`user` | `auto_moderation`, optional)
  - `targetType` (`video` | `channel`, optional; chi ap dung cho user reports)
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 100)
- Response HTTP 200:
  - Envelope `data`:
    - `items` (array), moi object gom:
      - `id` (string)
      - `source` (`user` | `auto_moderation`)
      - `targetType` (`video` | `channel`)
      - `targetVideoId` (string | null)
      - `targetChannelId` (string | null)
      - `title` (string)
      - `reporterLabel` (string)
      - `reporterUserId` (string | null)
      - `reason` (string)
      - `confidencePercent` (number | null)
      - `evidenceTimestampSeconds` (number | null)
      - `contextVideoId` (string | null)
      - `contextVideoTitle` (string | null)
      - `status` (`pending` | `resolved` | `dismissed` | `rejected`)
      - `createdAt` (string ISO): thoi diem video vao status moderation hien tai
      - `priority` (`low` | `medium` | `high` | `critical`)
    - `pagination`:
      - `page` (number)
      - `limit` (number)
      - `total` (number)
      - `totalPages` (number)

### 9.8 PATCH `/api/media/admin/reports/:id/status`

- Muc dich: admin mark user-submitted report la `resolved` hoac `dismissed`.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Body:

```json
{
  "status": "resolved"
}
```

- Response HTTP 200:
  - Envelope `data`: content report sau khi cap nhat status.
- Ghi chu:
  - Endpoint nay chi ap dung cho user-submitted reports, khong cap nhat synthetic auto moderation report.

### 9.9 GET `/api/media/admin/videos?page=1&limit=20&status=ready&visibility=public&channelId=...&ownerId=...&q=...`

- Muc dich: admin lay danh sach tat ca video trong he thong, gom public/private/draft/processing/rejected/failed/ready va video da soft delete.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Query:
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 100)
  - `status` optional: `draft`, `pending_moderation`, `processing`, `pending_manual_review`, `rejected`, `ready`, `failed`
  - `visibility` optional: `public`, `private`
  - `channelId` optional: loc theo channel
  - `ownerId` optional: loc theo creator/user owner
  - `q` optional: search theo `title` hoac `description`
- Ghi chu:
  - Neu thieu role hoac role khac `admin` thi tra `FORBIDDEN` / HTTP 403 voi message `Admin role is required`.
  - `status` hoac `visibility` khong hop le bi validation reject `BAD_REQUEST` / HTTP 400.
  - Sap xep mac dinh theo `updatedAt DESC`, fallback `createdAt DESC`.
- Response HTTP 200:
  - Envelope `data`:
    - `items` (array), moi object gom:
      - `id` (string)
      - `channelId` (string)
      - `ownerId` (string)
      - `title` (string)
      - `description` (string)
      - `category` (string)
      - `tags` (string[])
      - `status` (string)
      - `visibility` (string)
      - `price` (number)
      - `requiredTierLevel` (number | null)
      - `thumbnailUrl` (string | null)
      - `durationSeconds` (number | null)
      - `resolutions` (string[])
      - `errorMessage` (string | null)
      - `jobStatus` (string)
      - `jobStatusMessage` (string)
      - `failureReason` (string | null)
      - `moderationDetails` (object | null)
      - `viewCount` (number)
      - `publishedAt` (string ISO | null)
      - `isDeleted` (boolean)
      - `deletedAt` (string ISO | null)
      - `deletedBy` (string | null)
      - `deleteReason` (string | null)
      - `createdAt` (string ISO)
      - `updatedAt` (string ISO)
    - `pagination`:
      - `page` (number)
      - `limit` (number)
      - `total` (number)
      - `totalPages` (number)

### 9.10 GET `/api/media/admin/videos/:id`

- Muc dich: admin xem chi tiet video bat ky status, gom ca private/draft/rejected/deleted.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): videoId
- Response HTTP 200:
  - Envelope `data`: admin video item, gom `ownerId`, `channelId`, metadata, processing/moderation fields, delete fields va timestamps.

### 9.11 PATCH `/api/media/admin/videos/:id/moderation`

- Muc dich: admin approve/reject video dang cho manual review.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): videoId
- Body approve:

```json
{
  "action": "approve"
}
```

- Body reject:

```json
{
  "action": "reject",
  "reason": "Policy issue"
}
```

- Ghi chu:
  - Chi xu ly video co `status = pending_manual_review`.
  - `reject` bat buoc co `reason`.
  - Approve chuyen video sang `ready`; reject chuyen video sang `rejected`.
- Response HTTP 200:
  - Envelope `data`: admin video item sau khi cap nhat.

## 10. ERROR RESPONSE CHUNG

Khi loi, service dung format:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error message",
  "data": null,
  "errorCode": "BAD_REQUEST",
  "requestId": "1744712345-abc1234",
  "timestamp": "2026-04-15T10:19:05.123Z",
  "path": "/api/media/..."
}
```

Mapping pho bien:

- `NOT_FOUND` -> 404
- `BAD_REQUEST` -> 400
- `UNAUTHORIZED` -> 401
- `FORBIDDEN` -> 403
- `CONFLICT` -> 409
- `INTERNAL_SERVER_ERROR` -> 500
