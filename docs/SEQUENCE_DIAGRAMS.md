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
| 1 | Xem video | `docs/sequence-diagrams/watch-video.puml` |
| 2 | Mo khoa video | `docs/sequence-diagrams/unlock-video.puml` |
| 3 | Dang ky hoi vien | `docs/sequence-diagrams/purchase-membership.puml` |
| 4 | Tao video moi / Upload video | `docs/sequence-diagrams/upload-video.puml` |
| 5 | Cap nhat thong tin video | `docs/sequence-diagrams/update-video-metadata.puml` |
| 6 | Go video | `docs/sequence-diagrams/unpublish-video.puml` |
| 7 | Quan ly goi hoi vien | `docs/sequence-diagrams/manage-membership-tiers.puml` |
| 8 | Quan ly kenh (Admin) | `docs/sequence-diagrams/manage-admin-channels.puml` |
| 9 | Duyet video (Admin) | `docs/sequence-diagrams/review-admin-video.puml` |
