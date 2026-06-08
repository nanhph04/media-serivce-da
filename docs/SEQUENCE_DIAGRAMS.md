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
| 1 | Xem video - tong quat | `docs/sequence-diagrams/watch-video/watch-video-overview.puml` |
| 2 | Xem video - chi tiet khoi tao phien phat | `docs/sequence-diagrams/watch-video/watch-video-detail-01-playback-session.puml` |
| 3 | Xem video - chi tiet tai playlist va segment | `docs/sequence-diagrams/watch-video/watch-video-detail-02-streaming-data.puml` |
| 4 | Xem video - chi tiet cap nhat tien do va luot xem | `docs/sequence-diagrams/watch-video/watch-video-detail-03-progress-view-event.puml` |
| 5 | Mo khoa video - tong quat | `docs/sequence-diagrams/unlock-video/unlock-video-overview.puml` |
| 6 | Mo khoa video - chi tiet kiem tra dieu kien | `docs/sequence-diagrams/unlock-video/unlock-video-detail-01-validation.puml` |
| 7 | Mo khoa video - chi tiet thanh toan va ghi nhan | `docs/sequence-diagrams/unlock-video/unlock-video-detail-02-payment-and-unlock.puml` |
| 8 | Mo khoa video - chi tiet su kien thanh toan | `docs/sequence-diagrams/unlock-video/unlock-video-detail-03-payment-success-event.puml` |
| 9 | Dang ky hoi vien | `docs/sequence-diagrams/purchase-membership.puml` |
| 10 | Upload video - tong quat | `docs/sequence-diagrams/upload-video/upload-video-overview.puml` |
| 11 | Upload video - chi tiet khoi tao upload | `docs/sequence-diagrams/upload-video/upload-video-detail-01-start-upload.puml` |
| 12 | Upload video - chi tiet multipart upload | `docs/sequence-diagrams/upload-video/upload-video-detail-02-multipart-upload.puml` |
| 13 | Upload video - chi tiet submit sang kiem duyet | `docs/sequence-diagrams/upload-video/upload-video-detail-03-submit-for-moderation.puml` |
| 14 | Upload video - chi tiet ket qua xu ly | `docs/sequence-diagrams/upload-video/upload-video-detail-04-processing-result.puml` |
| 15 | Cap nhat thong tin video | `docs/sequence-diagrams/update-video-metadata.puml` |
| 16 | Go video | `docs/sequence-diagrams/unpublish-video.puml` |
| 17 | Quan ly goi hoi vien | `docs/sequence-diagrams/manage-membership-tiers.puml` |
| 18 | Quan ly kenh (Admin) | `docs/sequence-diagrams/manage-admin-channels.puml` |
| 19 | Duyet video (Admin) | `docs/sequence-diagrams/review-admin-video.puml` |
| 20 | Them danh muc moi | `docs/sequence-diagrams/create-category.puml` |
| 21 | Cap nhat danh muc | `docs/sequence-diagrams/update-category.puml` |
