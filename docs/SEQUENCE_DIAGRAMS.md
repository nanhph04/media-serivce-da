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
| 5 | Mo khoa video | `docs/sequence-diagrams/unlock-video.puml` |
| 6 | Dang ky hoi vien | `docs/sequence-diagrams/purchase-membership.puml` |
| 7 | Tao video moi / Upload video | `docs/sequence-diagrams/upload-video.puml` |
| 8 | Cap nhat thong tin video | `docs/sequence-diagrams/update-video-metadata.puml` |
| 9 | Go video | `docs/sequence-diagrams/unpublish-video.puml` |
| 10 | Quan ly goi hoi vien | `docs/sequence-diagrams/manage-membership-tiers.puml` |
| 11 | Quan ly kenh (Admin) | `docs/sequence-diagrams/manage-admin-channels.puml` |
| 12 | Duyet video (Admin) | `docs/sequence-diagrams/review-admin-video.puml` |
| 13 | Them danh muc moi | `docs/sequence-diagrams/create-category.puml` |
| 14 | Cap nhat danh muc | `docs/sequence-diagrams/update-category.puml` |
