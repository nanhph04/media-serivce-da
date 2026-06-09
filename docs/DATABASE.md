# Media Service Database Notes

## Recommended database design

PlantUML ERD đề xuất cho media-service:

```text
docs/database-design.puml
```

Các hình chi tiết được tách nhỏ để đưa vào Word dễ đọc:

```text
docs/database-design-content-detail.puml
docs/database-design-membership-detail.puml
docs/database-design-operations-detail.puml
```

Thiết kế này lược bỏ bớt phần tạp của schema hiện tại: gom tên bảng theo nghiệp
vụ, dùng tên khóa rõ nghĩa hơn, không lưu file nhị phân trong database, giữ
metadata video và trạng thái xử lý trong `videos`, còn trạng thái upload, xem
video, hội viên và event được tách thành các bảng riêng.

## videos thumbnail columns

Thumbnail metadata is stored on `videos`; image binary files are stored in MinIO.

- `thumbnail_object_key` (`varchar(500)`, nullable): MinIO object key for the active thumbnail.
- `thumbnail_url` (`varchar(500)`, nullable): public URL for the active thumbnail.
- `thumbnail_source` (`varchar(16)`, default `auto`): `auto` or `custom`.
- `thumbnail_status` (`varchar(16)`, default `pending`): `pending`, `processing`, `ready`, or `failed`.
- `thumbnail_generated_at` (`timestamp`, nullable): when the active thumbnail became ready.
- `thumbnail_error` (`text`, nullable): last auto-generation failure message.

Migration: `1746240000000-add-video-thumbnails.ts`.

## video upload session tables

Resumable multipart upload state is stored in two tables. Raw video bytes stay in
MinIO; these tables only store control metadata needed to resume and complete an
upload.

- `video_upload_sessions`
  - `video_id`: draft video being uploaded.
  - `user_id`: owner that started the upload.
  - `raw_file_key`: target object key in raw bucket.
  - `upload_id`: MinIO multipart upload id.
  - `part_size_bytes`: byte size used by the client when slicing the file.
  - `file_name`, `file_size`, `file_last_modified`: client file identity metadata.
  - `status`: `active`, `completed`, or `aborted`.
  - `expires_at`: cleanup cutoff for abandoned uploads.

- `video_upload_parts`
  - `session_id`: upload session id.
  - `part_number`: 1-based part index.
  - `etag`: MinIO ETag returned after uploading that part.
  - `size_bytes`: uploaded part size.
  - `uploaded_at`: when media service recorded the part.

Migration: `1746250000000-create-video-upload-sessions.ts`.

## video view daily stats

Daily view counters are stored in `video_view_daily_stats` so discovery APIs can rank videos by views in a day/week/month period. Raw view events are still deduplicated and aggregated before updating `videos.view_count`; this table stores period-level counters for ranking only.

- `video_id` (`varchar(36)`): video being counted.
- `stat_date` (`date`): UTC date bucket for the view event timestamp.
- `view_count` (`integer`, default `0`): number of accepted view events for the video/date.
- `created_at`, `updated_at`: audit timestamps.
- Primary key: (`video_id`, `stat_date`).
- Index: `IDX_video_view_daily_stats_stat_date_view_count` on (`stat_date`, `view_count DESC`).

Migration: `1746280000000-create-video-view-daily-stats.ts`.
