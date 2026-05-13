# Media Service - API Gateway Usage

Last updated: 2026-05-13

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
GET /api/media/categories/:slug/videos
GET /api/media/tags
GET /api/media/search
GET /api/media/videos
GET /api/media/videos/discovery/latest
GET /api/media/videos/discovery/by-category
GET /api/media/videos/:id/metadata
GET /api/media/stream/:videoId/master.m3u8?token=...
GET /api/media/stream/:videoId/segments/:segmentName?token=...
```

Stream routes are public for gateway auth/header purposes, but they still require
the playback `token` query parameter. Clients obtain the token from
`GET /api/media/videos/:id/play` or
`POST /api/media/videos/:id/playback-token/refresh`.

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
GET    /api/media/channels/me
POST   /api/media/channels
PATCH  /api/media/channels/:id
GET    /api/media/channels/:id/membership-status
PATCH  /api/media/channels/:id/admin/membership
POST   /api/media/channels/:channelId/membership-tiers
PATCH  /api/media/channels/:channelId/membership-tiers/:tierId
DELETE /api/media/channels/:channelId/membership-tiers/:tierId
GET    /api/media/memberships/me
GET    /api/media/videos/me
POST   /api/media/videos/init-upload
POST   /api/media/videos/:id/confirm-upload
GET    /api/media/videos/:id/play
POST   /api/media/videos/:id/progress
GET    /api/media/videos/:id/progress
GET    /api/media/videos/:id/progress/stream
POST   /api/media/videos/:id/playback-token/refresh
PATCH  /api/media/videos/:id/metadata
GET    /api/media/videos/library/purchased
GET    /api/media/videos/discovery/subscribed
GET    /api/media/videos/continue-watching
GET    /api/media/admin/categories
POST   /api/media/admin/categories
PATCH  /api/media/admin/categories/:id
DELETE /api/media/admin/categories/:id
GET    /api/media/admin/tags
POST   /api/media/admin/tags
PATCH  /api/media/admin/tags/:id
DELETE /api/media/admin/tags/:id
```

For protected routes, clients must send:

```http
Authorization: Bearer <accessToken>
```

## SSE Progress Stream

This route uses a dedicated streaming proxy:

```text
GET /api/media/videos/:id/progress/stream
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
  "path": "/api/media/videos/me"
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
