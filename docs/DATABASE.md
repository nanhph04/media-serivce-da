# ER diagram

## videos thumbnail columns

Thumbnail metadata is stored on `videos`; image binary files are stored in MinIO.

- `thumbnail_object_key` (`varchar(500)`, nullable): MinIO object key for the active thumbnail.
- `thumbnail_url` (`varchar(500)`, nullable): public URL for the active thumbnail.
- `thumbnail_source` (`varchar(16)`, default `auto`): `auto` or `custom`.
- `thumbnail_status` (`varchar(16)`, default `pending`): `pending`, `processing`, `ready`, or `failed`.
- `thumbnail_generated_at` (`timestamp`, nullable): when the active thumbnail became ready.
- `thumbnail_error` (`text`, nullable): last auto-generation failure message.

Migration: `1746240000000-add-video-thumbnails.ts`.
