# Media Service

Media Service là service trung tâm của hệ thống media, chịu trách nhiệm quản lý kênh, video, danh mục, gói hội viên, quyền xem video và các nghiệp vụ liên quan đến nội dung.

## Vai trò chính

- Tạo và quản lý channel của người dùng.
- Tải video lên Object Storage theo cơ chế multipart upload.
- Lưu metadata video, trạng thái xử lý, trạng thái kiểm duyệt và trạng thái xuất bản.
- Gửi job xử lý video sang Media Processing Service qua BullMQ/Redis.
- Gửi yêu cầu kiểm duyệt sang Moderation Service qua Kafka/event.
- Cung cấp dữ liệu phát video HLS cho người xem đủ quyền.
- Quản lý danh mục, gói hội viên, mua hội viên và mở khóa video.
- Nhận event từ Finance Service, Media Processing Service và Moderation Service để cập nhật dữ liệu media.

## Tích hợp hệ thống

| Thành phần | Cách tích hợp |
| --- | --- |
| API Gateway | Client gọi API media thông qua gateway; service đọc các header nội bộ do gateway gắn. |
| PostgreSQL | Lưu channel, video, category, membership, quyền truy cập, lượt xem và outbox. |
| Redis/BullMQ | Đẩy job xử lý video cho Media Processing Service. |
| Kafka | Publish/consume event xử lý video, kiểm duyệt, thanh toán và lượt xem. |
| MinIO/Object Storage | Lưu video gốc, HLS output, thumbnail và public media asset. |
| Finance Service | Tạo/thực hiện thanh toán nội bộ cho video trả phí và membership. |
| Media Processing Service | Xử lý transcode HLS và thumbnail. |
| Moderation Service | Kiểm duyệt nội dung video. |

## Tài liệu liên quan

| Tài liệu | Mục đích |
| --- | --- |
| [`docs/API.md`](docs/API.md) | Danh sách API Media dành cho Frontend/Mobile. |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Thiết kế dữ liệu media, channel, video, membership và quyền truy cập. |
| [`docs/ENV.md`](docs/ENV.md) | Biến môi trường quan trọng. |
| [`docs/EVENTS.md`](docs/EVENTS.md) | Event publish/consume của Media Service. |
| [`docs/FLOWS.md`](docs/FLOWS.md) | Các luồng nghiệp vụ media chính. |
| [`docs/SEQUENCE_DIAGRAMS.md`](docs/SEQUENCE_DIAGRAMS.md) | Mục lục sequence diagram. |
| [`docs/ACTIVITY_DIAGRAMS.md`](docs/ACTIVITY_DIAGRAMS.md) | Mục lục activity diagram. |

## Yêu cầu môi trường

- Node.js 22.x
- npm
- PostgreSQL
- Redis
- Kafka nếu bật `KAFKA_ENABLE=true`
- MinIO/Object Storage
- Finance Service nếu dùng thanh toán nội bộ
- Media Processing Service và Moderation Service nếu chạy đủ luồng upload video

## Cấu hình môi trường

Tạo file `.env` từ file mẫu:

```powershell
Copy-Item .env.example .env
```

Các nhóm biến quan trọng:

| Nhóm biến | Ý nghĩa |
| --- | --- |
| `PORT` | Cổng chạy service, mặc định `4002`. |
| `DB_*` | Kết nối PostgreSQL và cấu hình migration. |
| `REDIS_*`, `BULLMQ_*` | Queue xử lý video và queue moderation. |
| `KAFKA_*` | Event xử lý video, kiểm duyệt, thanh toán, lượt xem. |
| `MINIO_*` | Bucket video gốc, video đã xử lý và public asset. |
| `INTERNAL_GATEWAY_SECRET`, `MEDIA_INTERNAL_SERVICE_ALLOWLIST` | Bảo vệ request nội bộ. |
| `FINANCE_*` | Kết nối và secret gọi Finance Service. |
| `PLAYBACK_TOKEN_*`, `VIDEO_VIEW_*` | Cấu hình phát video và ghi nhận lượt xem. |
| `MEMBERSHIP_*`, `PAYMENT_*` | Quy tắc membership và giải ngân doanh thu. |
| `ZAI_*` | AI gợi ý metadata nếu tính năng được bật. |

## Chạy local

```powershell
npm install
npm run migration:run
npm run start:dev
```

Nếu cần dữ liệu demo cho upload:

```powershell
npm run seed:demo-user-upload
```

## Chạy bằng Docker Compose

Đảm bảo network `app-network` và hạ tầng dùng chung đã chạy, sau đó:

```powershell
docker compose up -d --build
```

Compose publish cổng `4002:4002`, mount source vào container và chạy `npm run start:dev`.

## Migration database

```powershell
npm run migration:show
npm run migration:run
npm run migration:revert
```

## Lệnh phát triển

```powershell
npm run build
npm run start
npm run start:dev
npm run start:prod
npm run lint
npm run format
npm run test
npm run test:e2e
npm run test:cov
```

## Luồng nghiệp vụ tiêu biểu

- Upload video multipart và xác nhận upload.
- Xử lý video HLS/thumbnail qua Media Processing Service.
- Kiểm duyệt video qua Moderation Service.
- Xem video và kiểm tra quyền truy cập.
- Mở khóa video trả phí.
- Mua và gia hạn gói hội viên.
- Quản lý channel, category và trạng thái xuất bản video.
