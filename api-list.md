date 14/05/2026

MEDIA SERVICE API LIST
Base URL: /api/media

Ghi chu chung
- `x-user-id`: He thong tu set tu gateway/auth service, frontend/client khong nen tu dien tay.
- `x-user-role`: Duoc gateway/auth service set cho cac API can role.
- `x-internal-secret`: He thong noi bo tu set khi goi qua gateway/service noi bo.
- API co `SkipInternalGatewayGuard` la API public, khong can `x-internal-secret`.
- Validation dang bat `whitelist + forbidNonWhitelisted + transform`.
- Success response THUC TE duoc wrap theo envelope:
  {
    "success": true,
    "code": 200,
    "data": { ... } | [ ... ] | "Hello World!" | null,
    "mess": "optional",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
- Voi endpoint `POST`, neu NestJS tra HTTP 201 thi response envelope co `code = 201`.
- Error response dung format `ApiError` o cuoi tai lieu nay.

==================================================
1. HEALTH CHECK
==================================================

1.1) GET /api/media/
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

==================================================
2. CHANNEL APIs
==================================================

2.0) GET /api/media/channels/me
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

2.1) POST /api/media/channels
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
    - `avatarUrl` (string)
    - `bannerUrl` (string)
    - `status` (string)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

2.2) PATCH /api/media/channels/:id
- Muc dich: cap nhat channel.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): channelId
- Body:
  - `name` (string, optional, max 100): Nguoi dung nhap
  - `bio` (string, optional, max 1000): Nguoi dung nhap
  - `avatarUrl` (string, optional): Nguoi dung nhap hoac client set tu ket qua upload
  - `bannerUrl` (string, optional): Nguoi dung nhap hoac client set tu ket qua upload
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
    - `avatarUrl` (string)
    - `bannerUrl` (string)
    - `status` (string)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

2.3) GET /api/media/channels/:id
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

2.4) GET /api/media/channels/:id/membership-status
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

2.5) GET /api/media/memberships/me?page=1&limit=20
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

2.6) PATCH /api/media/channels/:id/admin/membership
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
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `userId` (string)
    - `name` (string)
    - `bio` (string)
    - `isEligibleForMembership` (boolean)
    - `isMembershipClosedByAdmin` (boolean)
    - `avatarUrl` (string)
    - `bannerUrl` (string)
    - `status` (string)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

==================================================
3. MEMBERSHIP TIER APIs
==================================================

3.1) GET /api/media/channels/:channelId/membership-tiers
- Muc dich: lay danh sach tier cua channel.
- Header:
  - `x-internal-secret`: He thong tu set
- Path param:
  - `channelId` (string)
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

3.2) GET /api/media/channels/:channelId/membership-tiers/:tierId
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

3.3) POST /api/media/channels/:channelId/membership-tiers
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

3.4) PATCH /api/media/channels/:channelId/membership-tiers/:tierId
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

3.5) DELETE /api/media/channels/:channelId/membership-tiers/:tierId
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

==================================================
4. VIDEO APIs
==================================================

4.0) GET /api/media/videos/me?limit=20&status=draft,processing&visibility=private
- Muc dich: lay danh sach video Studio cua chinh creator hien tai, gom ca draft/private/trang thai xu ly.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Query:
  - `limit` (number, optional, default 20, min 1, max 50)
  - `status` (string, optional): danh sach status phan tach bang dau phay. Gia tri hop le: `draft`, `pending_moderation`, `processing`, `pending_manual_review`, `rejected`, `ready`, `failed`
  - `visibility` (string, optional): danh sach visibility phan tach bang dau phay. Gia tri hop le: `public`, `private`
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Ghi chu:
  - Endpoint nay chi tra video owner hien tai.
  - Hien tai chua ho tro cursor pagination; dung `limit` + filter don gian.
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
    - `durationSeconds` (number | null)
    - `resolutions` (string[])
    - `errorMessage` (string | null)
    - `jobStatus` (string | null)
    - `jobStatusMessage` (string | null)
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

4.0A) GET /api/media/videos?q=...&category=...&tags=tag1,tag2&limit=20
- Muc dich: tim kiem/list public videos truc tiep tu video controller.
- Public API: khong can `x-internal-secret`.
- Query:
  - `q` (string, optional): keyword search.
  - `category` (string, optional): category slug.
  - `tags` (string, optional): danh sach tag slug/name phan tach bang dau phay; backend trim, bo rong, va unique.
  - `limit` (number, optional, default 20, min 1, max 50)
- Ghi chu:
  - Endpoint nay chi tra public videos co the expose cho discovery.
  - Khac voi `GET /api/media/search`: endpoint nay chi tra videos, khong tra channels.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `channelId` (string)
    - `title` (string)
    - `description` (string)
    - `category` (string)
    - `tags` (string[])
    - `status` (string)
    - `price` (number)
    - `requiredTierLevel` (number | null)
    - `thumbnailUrl` (string | null)
    - `durationSeconds` (number | null)
    - `resolutions` (string[])
    - `errorMessage` (string | null)
    - `viewCount` (number)
    - `publishedAt` (string ISO | null)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

4.1) POST /api/media/videos/init-upload
- Muc dich: tao video draft va tra presigned upload URL.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Body:
  - `channelId` (string, optional, deprecated): backend IGNORE, channel duoc resolve tu `x-user-id`
  - `title` (string, bat buoc, max 200)
  - `description` (string, optional, default `""`)
  - `categoryId` (string, bat buoc): ID cua category chinh, category phai ton tai va dang `active`
  - `tagIds` (string[], optional, default `[]`): danh sach tag ID, unique, tat ca tag phai ton tai va dang `active`
  - `visibility` (`public` | `private`, optional, default `public`)
  - `price` (number, optional, default 0, min 0)
  - `requiredTierLevel` (number | null, optional, min 1)
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Ghi chu:
  - Backend KHONG con fallback ve category mac dinh.
  - Backend KHONG nhan `categories` nua; uploader chi duoc gui `categoryId`.
  - Neu thieu `categoryId`, `categoryId` rong sau khi trim, hoac category khong ton tai / khong active thi tra `BAD_REQUEST` / HTTP 400.
  - Neu `tagIds` bi duplicate, co tag khong ton tai, hoac tag khong active thi tra `BAD_REQUEST` / HTTP 400.
- Response HTTP 201:
  - Envelope `data`:
    - `videoId` (string)
    - `status` (string)
    - `rawFileKey` (string)
    - `bucket` (string)
    - `uploadUrl` (string)

4.2) POST /api/media/videos/:id/confirm-upload
- Muc dich: xac nhan upload xong de he thong xu ly video.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): videoId
- Body:
  - `resolutions` (string[], bat buoc, unique, 1-3 phan tu)
  - Gia tri hop le hien tai: `480p`, `720p`, `1080p`
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
- Ghi chu:
  - Chi owner duoc confirm.
  - Chi confirm duoc khi video con `status = draft`; cac status khac tra `CONFLICT` / HTTP 409.
  - Backend kiem tra raw object ton tai, size > 0, va khong vuot gioi han upload.
  - Khi confirm thanh cong, backend copy raw object sang immutable key `uploads/confirmed/{videoId}/{uuid}.mp4` truoc khi publish moderation event. Presigned URL cu neu con han se khong ghi de file dang moderation/transcode.
- Response HTTP 201:
  - Envelope `data`:
    - `status` (string)
    - `message` (string)

4.3) POST /api/media/videos/:id/replace-upload
- Muc dich: doi raw upload file cho video draft va tra presigned upload URL moi.
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
  - Chi owner duoc replace.
  - Chi replace duoc khi video con `status = draft`; cac status khac tra `CONFLICT` / HTTP 409.
  - Backend sinh `rawFileKey` moi va upload URL moi.
  - Raw object cu se duoc xoa best-effort neu ton tai; neu xoa cu that bai thi upload moi van duoc tra ve va cleanup job se don sau.
- Response HTTP 201:
  - Envelope `data`:
    - `videoId` (string)
    - `status` (string)
    - `rawFileKey` (string)
    - `bucket` (string)
    - `uploadUrl` (string)

4.4) DELETE /api/media/videos/:id/upload
- Muc dich: huy upload video draft khi user khong muon upload nua.
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
  - Chi owner duoc cancel.
  - Chi cancel duoc khi video con `status = draft`; cac status khac tra `CONFLICT` / HTTP 409.
  - Backend xoa raw object neu ton tai, xoa processing progress cache, va hard delete video draft trong DB.
  - Neu raw object chua duoc upload thi van xoa draft video binh thuong.
- Response HTTP 200:
  - Envelope `data`:
    - `videoId` (string)
    - `cancelled` (boolean)

4.5) DELETE /api/media/videos/:id/failed-upload
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

4.6) DELETE /api/media/videos/:id
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

4.7) GET /api/media/videos/:id/play
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

4.8) POST /api/media/videos/:id/progress
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

4.9) POST /api/media/videos/:id/playback-token/refresh
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

4.10) GET /api/media/videos/:id/metadata
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
    - `title` (string)
    - `description` (string)
    - `categoryId` (string): id cua category chinh hien tai
    - `category` (string): category slug
    - `tagIds` (string[]): danh sach tag id hien tai
    - `tags` (string[]): danh sach tag slug hien tai
    - `thumbnailUrl` (string | null)
    - `viewCount` (number)
    - `status` (string)
    - `visibility` (string)
    - `errorMessage` (string | null)
    - `jobStatus` (string | null)
    - `jobStatusMessage` (string | null)
    - `failureReason` (string | null)
    - `moderationDetails` (object | null)
    - `publishedAt` (string ISO | null)
    - `isDeleted` (boolean)
    - `deletedAt` (string ISO | null)
    - `deletedBy` (string | null)
    - `deleteReason` (string | null)
    - `updatedAt` (string ISO)

4.11) PATCH /api/media/videos/:id/metadata
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
- Ghi chu:
  - Chi owner duoc sua; non-owner tra `FORBIDDEN` / HTTP 403.
  - Response tra ca id va slug: FE nen dung `categoryId/tagIds` de set value edit form, va dung `category/tags` nhu slug cho display/filter.
- Response HTTP 200:
  - Envelope `data`:
    - `id` (string)
    - `title` (string)
    - `description` (string)
    - `categoryId` (string): id cua category chinh sau update
    - `category` (string): category slug sau update
    - `tagIds` (string[]): danh sach tag id sau update
    - `tags` (string[]): danh sach tag slug sau update
    - `thumbnailUrl` (string | null)
    - `viewCount` (number)
    - `status` (string)
    - `visibility` (string)
    - `errorMessage` (string | null)
    - `jobStatus` (string | null)
    - `jobStatusMessage` (string | null)
    - `failureReason` (string | null)
    - `moderationDetails` (object | null)
    - `publishedAt` (string ISO | null)
    - `isDeleted` (boolean)
    - `deletedAt` (string ISO | null)
    - `deletedBy` (string | null)
    - `deleteReason` (string | null)
    - `updatedAt` (string ISO)

4.12) GET /api/media/videos/discovery/latest?limit=20
- Muc dich: lay danh sach video moi nhat.
- Public API: khong can `x-internal-secret`.
- Query:
  - `limit` (number, optional, default 20, min 1, max 50)
- He thong tu set them khi xu ly:
  - Neu thieu `limit` thi he thong dung `20`
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `channelId` (string)
    - `title` (string)
    - `description` (string)
    - `category` (string)
    - `tags` (string[])
    - `status` (string)
    - `price` (number)
    - `requiredTierLevel` (number | null)
    - `thumbnailUrl` (string | null)
    - `durationSeconds` (number | null)
    - `resolutions` (string[])
    - `errorMessage` (string | null)
    - `viewCount` (number)
    - `publishedAt` (string ISO | null)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

4.13) GET /api/media/videos/library/purchased?page=1&limit=20
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
  - Du lieu den tu bang `video_purchase_unlocks`, duoc tao khi media_service nhan event `video.payment.success`.
  - Endpoint nay chi list video user da unlock/mua le, khong phai membership feed.
  - Sap xep theo lan unlock moi nhat truoc.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `channelId` (string)
    - `title` (string)
    - `description` (string)
    - `category` (string)
    - `tags` (string[])
    - `status` (string)
    - `price` (number)
    - `requiredTierLevel` (number | null)
    - `thumbnailUrl` (string | null)
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

4.14) GET /api/media/videos/discovery/by-category?category=...&page=1&limit=20
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
    - `title` (string)
    - `description` (string)
    - `category` (string)
    - `tags` (string[])
    - `status` (string)
    - `price` (number)
    - `requiredTierLevel` (number | null)
    - `thumbnailUrl` (string | null)
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

4.15) GET /api/media/categories/:slug/videos?page=1&limit=20
- Muc dich: lay danh sach video public theo category slug qua nested category route.
- Public API: khong can `x-internal-secret`.
- Path param:
  - `slug` (string): category slug
- Query:
  - `page` (number, optional, default 1, min 1)
  - `limit` (number, optional, default 20, min 1, max 50)
- Ghi chu:
  - Endpoint nay dung chung logic voi `GET /api/media/videos/discovery/by-category?category=...`.
  - Neu category khong ton tai hoac khong `active` thi tra `NOT_FOUND` / HTTP 404.
- Response HTTP 200:
  - Envelope `data`: array, moi object giong shape cua `GET /api/media/videos/discovery/by-category`
  - Envelope `pagination`:
    - `page` (number)
    - `limit` (number)
    - `total` (number)
    - `totalPages` (number)

4.16) GET /api/media/videos/discovery/subscribed?limit=20
- Muc dich: lay video public moi tu cac channel ma user dang co membership active.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Query:
  - `limit` (number, optional, default 20, min 1, max 50)
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
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
    - `title` (string)
    - `description` (string)
    - `category` (string)
    - `tags` (string[])
    - `status` (string)
    - `price` (number)
    - `requiredTierLevel` (number | null)
    - `thumbnailUrl` (string | null)
    - `durationSeconds` (number | null)
    - `resolutions` (string[])
    - `errorMessage` (string | null)
    - `viewCount` (number)
    - `publishedAt` (string ISO | null)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

4.17) GET /api/media/videos/continue-watching?limit=20
- Muc dich: lay danh sach video user dang xem do de hien thi muc xem tiep.
- Header:
  - `x-user-id`: He thong tu set
  - `x-internal-secret`: He thong tu set
- Query:
  - `limit` (number, optional, default 20, min 1, max 50)
- He thong tu set them khi xu ly:
  - `userId`: lay tu header `x-user-id`
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

==================================================
5. SEARCH APIs
==================================================

5.1) GET /api/media/search?q=...&category=...&limit=20
- Muc dich: tim kiem tong hop public videos va channels.
- Public API: khong can `x-internal-secret`.
- Query:
  - `q` (string, optional, max 200): keyword tim kiem. Match:
    - video: `title`, `description`
    - channel: `name`, `bio`
  - `category` (string, optional, max 100): category slug. Input duoc normalize ve slug.
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
    - `videos` (array), moi object giong shape cua `GET /api/media/videos/discovery/latest`
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
      - `limit` (number)

==================================================
6. STREAMING APIs
==================================================

6.1) GET /api/media/stream/:videoId/master.m3u8?token=...
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

6.2) GET /api/media/stream/:videoId/segments/:segmentName?token=...
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

==================================================
7. CATEGORY APIs
==================================================

7.1) GET /api/media/categories?q=...
- Muc dich: lay danh sach category public dang ACTIVE, co ho tro search.
- Public API: khong can `x-internal-secret`.
- Query:
  - `q` (string, optional): keyword search theo `name` hoac `slug`.
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

7.2) GET /api/media/admin/categories?q=...
- Muc dich: admin lay tat ca category hoac search category, gom ACTIVE, INACTIVE, DELETED.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Query:
  - `q` (string, optional): keyword search theo `name` hoac `slug`.
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

7.2A) GET /api/media/categories/admin/all?q=...
- Muc dich: admin lay tat ca category hoac search category qua route categories controller.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Query:
  - `q` (string, optional): keyword search theo `name` hoac `slug`.
- Ghi chu:
  - Route nay dang ton tai song song voi `GET /api/media/admin/categories`.
  - Response shape va rule admin giong `GET /api/media/admin/categories`.

7.3) POST /api/media/admin/categories
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

7.3A) POST /api/media/categories
- Muc dich: admin tao category moi qua route categories controller.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Body/response/rule:
  - Giong `POST /api/media/admin/categories`.

7.4) PATCH /api/media/admin/categories/:id
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

7.4A) PATCH /api/media/categories/:id
- Muc dich: admin cap nhat category qua route categories controller.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Path/body/response/rule:
  - Giong `PATCH /api/media/admin/categories/:id`.

7.5) DELETE /api/media/admin/categories/:id
- Muc dich: admin xoa mem category bang cach chuyen `status` ve `inactive`.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Path param:
  - `id` (string): categoryId
- Response HTTP 200:
  - Envelope `data`: category sau khi inactive.

7.5A) DELETE /api/media/categories/:id
- Muc dich: admin xoa mem category qua route categories controller.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Path/response/rule:
  - Giong `DELETE /api/media/admin/categories/:id`.

==================================================
8. TAG APIs
==================================================

8.1) GET /api/media/tags?q=...
- Muc dich: lay danh sach tag public dang ACTIVE, co ho tro search.
- Public API: khong can `x-internal-secret`.
- Query:
  - `q` (string, optional): keyword search theo `name` hoac `slug`.
- Response HTTP 200:
  - Envelope `data`: array, moi object gom:
    - `id` (string)
    - `name` (string)
    - `slug` (string)
    - `status` (`active`)
    - `createdAt` (string ISO)
    - `updatedAt` (string ISO)

8.2) GET /api/media/admin/tags?q=...
- Muc dich: admin lay tat ca tag hoac search tag, gom `active`, `inactive`, `pending`, `deleted`.
- Header:
  - `x-user-id`: He thong tu set
  - `x-user-role`: Bat buoc la `admin`
  - `x-internal-secret`: He thong tu set
- Response HTTP 200:
  - Envelope `data`: array tag.

8.3) POST /api/media/admin/tags
- Muc dich: admin tao tag moi.
- Body:
  - `name` (string, bat buoc, max 100)
- Response HTTP 201:
  - Envelope `data`: tag vua tao.

8.4) PATCH /api/media/admin/tags/:id
- Muc dich: admin cap nhat tag.
- Body:
  - `name` (string, optional, max 100)
  - `status` (`active` | `inactive` | `pending` | `deleted`, optional)
- Response HTTP 200:
  - Envelope `data`: tag sau khi cap nhat.

8.5) DELETE /api/media/admin/tags/:id
- Muc dich: admin xoa mem tag bang cach chuyen `status` ve `inactive`.
- Response HTTP 200:
  - Envelope `data`: tag sau khi inactive.

==================================================
9. ERROR RESPONSE CHUNG
==================================================

Khi loi, service dung format:
{
  "success": false,
  "code": 400,
  "mess": "Error message",
  "data": null,
  "errors": ["Error detail"],
  "requestId": "1744712345-abc1234",
  "timestamp": "2026-04-15T10:19:05.123Z",
  "path": "/api/media/..."
}

Mapping pho bien:
- `NOT_FOUND` -> 404
- `BAD_REQUEST` -> 400
- `UNAUTHORIZED` -> 401
- `FORBIDDEN` -> 403
- `CONFLICT` -> 409
- `INTERNAL_SERVER_ERROR` -> 500
