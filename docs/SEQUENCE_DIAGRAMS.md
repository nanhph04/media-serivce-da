# Media Service Sequence Diagrams

Last updated: 2026-06-07

Tai lieu nay la muc luc sequence diagram cho media-service. Moi bieu do
duoc tach thanh mot file rieng trong thu muc `docs/sequence-diagrams/`.

Gateway public path hien tai:

- Media: `/api/media/*`

## Quy uoc

- `->`: Goi dong bo
- `-->`: Tra ket qua
- `->>`: Gui su kien hoac callback bat dong bo

## Danh sach bieu do

| STT | Chuc nang | File |
| --- | --- | --- |
| 1 | Xem video - tổng quát | `docs/sequence-diagrams/watch-video/watch-video-overview.puml` |
| 2 | Xem video - chi tiết khởi tạo phiên phát | `docs/sequence-diagrams/watch-video/watch-video-detail-01-playback-session.puml` |
| 3 | Xem video - chi tiết tải playlist và segment | `docs/sequence-diagrams/watch-video/watch-video-detail-02-streaming-data.puml` |
| 4 | Xem video - chi tiết cập nhật tiến độ và lượt xem | `docs/sequence-diagrams/watch-video/watch-video-detail-03-progress-view-event.puml` |
| 5 | Mở khóa video - tổng quát | `docs/sequence-diagrams/unlock-video/unlock-video-overview.puml` |
| 6 | Mở khóa video - chi tiết kiểm tra điều kiện | `docs/sequence-diagrams/unlock-video/unlock-video-detail-01-validation.puml` |
| 7 | Mở khóa video - chi tiết thanh toán và ghi nhận | `docs/sequence-diagrams/unlock-video/unlock-video-detail-02-payment-and-unlock.puml` |
| 8 | Mở khóa video - chi tiết sự kiện thanh toán | `docs/sequence-diagrams/unlock-video/unlock-video-detail-03-payment-success-event.puml` |
| 9 | Dang ky hoi vien | `docs/sequence-diagrams/purchase-membership.puml` |
| 10 | Upload video - tong quat | `docs/sequence-diagrams/upload-video/upload-video-overview.puml` |
| 11 | Upload video - chi tiet khoi tao upload | `docs/sequence-diagrams/upload-video/upload-video-detail-01-start-upload.puml` |
| 12 | Upload video - chi tiet multipart upload | `docs/sequence-diagrams/upload-video/upload-video-detail-02-multipart-upload.puml` |
| 13 | Upload video - chi tiet submit sang kiem duyet | `docs/sequence-diagrams/upload-video/upload-video-detail-03-submit-for-moderation.puml` |
| 14 | Upload video - chi tiet ket qua xu ly | `docs/sequence-diagrams/upload-video/upload-video-detail-04-processing-result.puml` |
| 15 | Cap nhat thong tin video | `docs/sequence-diagrams/update-video-metadata.puml` |
| 16 | Gỡ video | `docs/sequence-diagrams/unpublish-video.puml` |
| 17 | Quan ly goi hoi vien | `docs/sequence-diagrams/manage-membership-tiers.puml` |
| 18 | Khóa kênh (Admin) - tổng quát | `docs/sequence-diagrams/manage-admin-channels/manage-admin-channels-overview.puml` |
| 19 | Khóa kênh (Admin) - Media Service khóa kênh | `docs/sequence-diagrams/manage-admin-channels/manage-admin-channels-detail-01-media-lock.puml` |
| 20 | Khóa kênh (Admin) - Finance xử lý payout | `docs/sequence-diagrams/manage-admin-channels/manage-admin-channels-detail-02-finance-event.puml` |
| 21 | Duyet video (Admin) | `docs/sequence-diagrams/review-admin-video.puml` |
| 22 | Them danh muc moi | `docs/sequence-diagrams/create-category.puml` |
| 23 | Cap nhat danh muc | `docs/sequence-diagrams/update-category.puml` |
