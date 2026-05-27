# Media Service - API Gateway Usage

Last updated: 2026-05-22

## Purpose

This guide documents how `media_service` is exposed through `api_gateway`.
Frontend/mobile clients should call the gateway, not the service directly.

```text
Client -> api_gateway -> media_service
```

Local examples:

```text
Gateway base URL: http://localhost:3000
Direct service:   http://localhost:4002
```

## Route Mapping

`media_service` already uses public prefix:

```text
/api/media
```

Gateway keeps media paths unchanged:

```text
GET /api/media/categories
-> GET /api/media/categories
```

## Downstream Trust Contract

Gateway is responsible for JWT verification on protected routes. Media service
trusts user context only after its `InternalGatewayGuard` verifies:

```text
x-internal-secret
```

Protected media controllers read:

```text
x-user-id
x-user-email
x-user-role
x-request-id
```

External clients must not send these headers manually. Gateway strips spoofed
versions case-insensitively and injects trusted values.

## Required Env Alignment

Set the media-specific secret in gateway:

```env
MEDIA_INTERNAL_GATEWAY_SECRET=<secret>
```

Set the matching secret in `media_service`:

```env
INTERNAL_GATEWAY_SECRET=<same secret>
```

Gateway falls back to `INTERNAL_GATEWAY_SECRET` in dev if
`MEDIA_INTERNAL_GATEWAY_SECRET` is not set, but service-specific secrets are the
preferred contract.

## Gateway Auth Policies For Media

Public routes do not require Bearer token and do not receive user context.
Important public GET routes:

```text
GET /api/media/
GET /api/media/categories
GET /api/media/tags
GET /api/media/search
GET /api/media/videos
GET /api/media/videos/latest
GET /api/media/videos/by-category
GET /api/media/videos/:id/metadata
GET /api/media/stream/:videoId/master.m3u8?token=...
GET /api/media/stream/:videoId/segments/:segmentName?token=...
```

Video responses expose `thumbnailUrl` as a permanent public MinIO object URL
from `MINIO_PUBLIC_BUCKET`. Clients should render that URL directly; they do not
call a gateway/media thumbnail route.

Stream routes are public for gateway auth/header purposes, but they still require
the playback `token` query parameter. Clients obtain the token from
`GET /api/media/me/videos/:id/play` or
`POST /api/media/me/videos/:id/playback-token/refresh`.

Optional-auth route:

```text
GET /api/media/channels/:id
```

Rules for optional auth:

- No token: gateway passes request.
- Valid token: gateway injects `x-user-*`.
- Invalid token: gateway returns 401.

The downstream media route is currently a public channel detail route. It skips
`InternalGatewayGuard`, so it does not require `x-internal-secret`.

Public-but-internal-read routes:

```text
GET /api/media/channels/:channelId/membership-tiers
GET /api/media/channels/:channelId/membership-tiers/:tierId
```

These routes are public to clients, but gateway still injects
`x-internal-secret` so the downstream guard can allow the request.

Protected routes include creator, membership, progress, admin, and write APIs,
for example:

```text
GET    /api/media/me/channel
POST   /api/media/me/channel
PATCH  /api/media/me/channel
POST   /api/media/me/channel/avatar
POST   /api/media/me/channel/banner
GET    /api/media/channels/:id/membership-status
PATCH  /api/media/admin/channels/:id/membership
POST   /api/media/channels/:channelId/membership-tiers
PATCH  /api/media/channels/:channelId/membership-tiers/:tierId
DELETE /api/media/channels/:channelId/membership-tiers/:tierId
GET    /api/media/memberships/me
PATCH  /api/media/memberships/:membershipId/auto-renew
POST   /api/media/channels/:channelId/memberships/:tierId/purchase
GET    /api/media/studio/videos
GET    /api/media/studio/videos/:id
POST   /api/media/studio/videos/uploads
POST   /api/media/studio/videos/:videoId/uploads/:uploadId/part-urls
POST   /api/media/studio/videos/:videoId/uploads/:uploadId/parts/:partNumber/completed
GET    /api/media/studio/videos/:videoId/uploads/:uploadId/status
POST   /api/media/studio/videos/:videoId/uploads/:uploadId/complete
POST   /api/media/studio/videos/:videoId/uploads/:uploadId/submit
DELETE /api/media/studio/videos/:videoId/uploads/:uploadId
GET    /api/media/me/videos/:id/play
POST   /api/media/me/videos/:id/progress
POST   /api/media/me/videos/:id/playback-token/refresh
POST   /api/media/videos/:id/reports
POST   /api/media/channels/:id/reports
PATCH  /api/media/studio/videos/:id/metadata
GET    /api/media/me/videos/purchased
POST   /api/media/videos/:id/purchase
GET    /api/media/me/videos/subscribed
GET    /api/media/me/videos/continue-watching
GET    /api/media/admin/categories
POST   /api/media/admin/categories
PATCH  /api/media/admin/categories/:id
DELETE /api/media/admin/categories/:id
GET    /api/media/admin/tags
POST   /api/media/admin/tags
PATCH  /api/media/admin/tags/:id
DELETE /api/media/admin/tags/:id
GET    /api/media/admin/channels/summary
GET    /api/media/admin/channels
GET    /api/media/admin/channels/membership-reviews
PATCH  /api/media/admin/channels/:id/membership-review
PATCH  /api/media/admin/channels/:id/status
GET    /api/media/admin/videos
GET    /api/media/admin/videos/:id
PATCH  /api/media/admin/videos/:id/moderation
GET    /api/media/admin/reports/summary
GET    /api/media/admin/reports
PATCH  /api/media/admin/reports/:id/status
```

For protected routes, clients must send:

```http
Authorization: Bearer <accessToken>
```

## SSE Progress Stream

This route uses a dedicated streaming proxy:

```text

```

It is protected. Gateway verifies JWT and forwards `x-user-*`,
`x-internal-secret`, and `x-request-id`.

## Public Route Safety Rule

Gateway route matching is method-aware. A public `GET` route does not make
`POST`, `PATCH`, or `DELETE` on the same path public.

Example:

```text
GET   /api/media/categories -> public
GET   /api/media/tags -> public
POST  /api/media/admin/categories -> protected
PATCH /api/media/admin/categories/:id -> protected
POST  /api/media/admin/tags -> protected
PATCH /api/media/admin/tags/:id -> protected
```

## Video Category/Tag Contract

Upload and metadata update requests use `categoryId` and `tagIds`.
Gateway must not translate these back to the old `categories` slug array.

```json
{
  "title": "Anime chien dau hoc duong",
  "description": "Mot video anime ngan...",
  "categoryId": "uuid-category",
  "tagIds": ["uuid-tag-1", "uuid-tag-2"],
  "visibility": "public",
  "price": 0
}
```

Public video responses expose:

```json
{
  "category": "anime",
  "tags": ["hanh-dong", "hoc-duong"]
}
```

## Resumable Video Upload Contract

Clients should use multipart upload routes:

```text
POST   /api/media/studio/videos/uploads
POST   /api/media/studio/videos/:videoId/uploads/:uploadId/part-urls
POST   /api/media/studio/videos/:videoId/uploads/:uploadId/parts/:partNumber/completed
GET    /api/media/studio/videos/:videoId/uploads/:uploadId/status
POST   /api/media/studio/videos/:videoId/uploads/:uploadId/complete
POST   /api/media/studio/videos/:videoId/uploads/:uploadId/submit
DELETE /api/media/studio/videos/:videoId/uploads/:uploadId
```

Gateway must treat all of these as protected routes and forward:

```text
x-user-id
x-internal-secret
x-request-id
```

The actual video bytes are uploaded by the client directly to MinIO presigned
part URLs returned by media service. Gateway only proxies metadata/control API
calls, not the raw video bytes.

If `thumbnailExtension` is provided when starting an upload, media service also
returns a presigned PUT URL for a custom thumbnail in `MINIO_PUBLIC_BUCKET`.
After submit, video responses expose the permanent public `thumbnailUrl`; the
client should not use the presigned PUT URL for rendering.

Channel avatar/banner upload routes accept multipart `file`, upload the object
to `MINIO_PUBLIC_BUCKET`, and return permanent public `avatarUrl`/`bannerUrl`.

## Error Shape

Gateway-generated errors use:

```json
{
  "success": false,
  "code": 401,
  "mess": "Invalid or expired token",
  "data": null,
  "errors": ["Invalid or expired token"],
  "requestId": "request-id",
  "timestamp": "2026-05-12T00:00:00.000Z",
  "path": "/api/media/studio/videos"
}
```

Use `mess`, not `message`, as the frontend-facing error message field.

## Integration Checklist

- Keep `MEDIA_INTERNAL_GATEWAY_SECRET` and media `INTERNAL_GATEWAY_SECRET`
  identical.
- Protected controllers should read user identity from `x-user-id`, not body.
- Admin checks should use `x-user-role`; gateway only forwards role, service
  enforces RBAC.
- Public GET routes must be declared in gateway manifest before FE depends on
  them.
- When adding or changing controller routes, sync `API_GATEWAY_USAGE.md`,
  `api-list.md`, and the gateway manifest together.
- Public route matching must include both HTTP method and path.
- Stream route proxying must preserve the query string, especially `token`.
- Direct calls to media service without `x-internal-secret` should fail for
  guarded routes.
