# Refactoring Plan: media_service Architecture

Mục tiêu: Đưa `media_service` tuân thủ nghiêm ngặt các nguyên tắc Clean Architecture và các quy luật trong `AGENTS.md`.

## User Review Required

> [!WARNING]
> Chúng ta sẽ xóa bỏ tất cả các tệp `index.ts` (barrel files) và thay đổi hàng loạt cấu trúc thư mục. Quy trình này sẽ tạo ra nhiều sửa đổi trên nhiều tệp. Hãy xác nhận kế hoạch trước khi quy trình bắt đầu.

> [!IMPORTANT]
> Để xóa bỏ hoàn toàn sự phụ thuộc chéo giữa các module (ví dụ: `videos` không được gọi trực tiếp Repo của `channels`), tôi sẽ thay thế bằng việc giao tiếp thông qua **Domain Service / Application Port** giữa các module, hoặc gọi trực tiếp Use Cases / Application Service nội bộ.

---

## Proposed Changes

Chúng ta sẽ thực hiện theo 4 giai đoạn chính để tránh làm hỏng cấu trúc hiện tại:

### 1. Xóa bỏ Barrel Files (Rule 17)
- Xóa toàn bộ các file `index.ts` bên trong `src/shared/`, `src/modules/*/presentation/dtos`,...
- Cập nhật mọi lượt import trong toàn cục hệ thống sử dụng đường dẫn file trực tiếp.

### 2. Định nghĩa Core Interfaces (Ports) cho Tầng Domain (Rule 8, Rule 10)
Chúng ta sẽ tạo các Interface đại diện cho Dependency Inversion của Application -> Infrastructure:

#### `shared` Core Interfaces
- **[NEW]** `src/shared/application/interfaces/cache.service.interface.ts`
- **[NEW]** `src/shared/application/interfaces/config.service.interface.ts`

#### `channels` Repositories
- **[NEW]** `src/modules/channels/domain/repositories/channel.repository.interface.ts`
- **[NEW]** `src/modules/channels/domain/repositories/channel-subscription.repository.interface.ts`
- **[NEW]** `src/modules/channels/domain/repositories/membership-tier.repository.interface.ts`

#### `videos` Repositories
- **[NEW]** `src/modules/videos/domain/repositories/video.repository.interface.ts`
- **[NEW]** `src/modules/videos/domain/repositories/video-purchase-unlock.repository.interface.ts`

### 3. Tái cấu trúc Infrastructure
- Cập nhật các class `RepositoryImpl` trong thư mục `infrastructure/persistence` để implements các interfaces vừa định nghĩa.
- Cập nhật các module (như `channels.module.ts`, `videos.module.ts`) để bind interface với class trỏ đúng nguyên tắc Dependency Injection (`{ provide: 'IVideoRepository', useClass: VideoRepository }`).

### 4. Dọn dẹp tầng Application và Presentation (Rule 3, 6, 18)

#### `channels` Module
- **[MODIFY]** `src/modules/channels/application/channel.application.service.ts`
  - Thay thế các class infrastructure bằng `@Inject('InterfaceName')`.
  - Xóa bỏ việc import `@InjectRepository(VideoOrmEntity)` và `@nestjs/typeorm`.
  - Để query Video, sẽ giao tiếp thông qua `VideoApplicationService` (Tầng Application) thay vì truy vấn trực tiếp vào infra của DB.
- **[MODIFY]** `src/modules/channels/presentation/controllers/channel.controller.ts`
  - Chỉnh sửa lại `getChannelDetail` trả về DTO thay vì map ORM/Domain Entities lộn xộn.

#### `videos` Module
- **[MODIFY]** `src/modules/videos/application/video.application.service.ts`
  - Gỡ bỏ `ChannelRepositoryImpl`, `ChannelSubscriptionRepositoryImpl`.
  - Triển khai gọi chéo thông qua `ChannelApplicationService` để kiểm tra quyền và Tier, đảm bảo loose coupling.

---

## Open Questions

> [!NOTE]
> 1. Hiện tại `channel.application.service.ts` query thông tin các videos công khai (`publicVideos`), nếu ta không inject `VideoOrmEntity` nữa, tôi sẽ gọi `VideoApplicationService.getPublicByChannel()` để lấy danh sách. Bạn có đồng ý với logic gọi liên thông giữa hai tính năng này qua Application Service không?
> 2. Có bất kỳ Interface cấu hình hay thông tin bổ sung nào cần cập nhật không?

---

## Verification Plan

### Automated Tests
- Thực hiện chạy `npm run build` để xác nhận Type Check pass 100%.
- Kiểm tra bằng lệnh format/linting.

### Manual Verification
- Code review thủ công các file liên quan xem còn sót import `*Impl` hay `@nestjs/typeorm` trong tầng application không.
