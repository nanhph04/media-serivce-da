# Biểu đồ tuần tự

## Quy tắc vẽ biểu đồ

- Mỗi hệ thống, service, storage, broker, database hoặc actor thật chỉ được biểu diễn bằng một participant duy nhất.
- Không tách cùng một đối tượng thành nhiều participant theo bucket, topic, namespace, trạng thái hoặc vai trò logic.
- Nếu cần phân biệt phần logic bên trong cùng một đối tượng, ghi rõ trong message hoặc note thay vì tạo participant mới.
- Nội dung mô tả trong biểu đồ sử dụng tiếng Việt.
- Chỉ giữ tiếng Anh cho tên service, tên trạng thái, topic/event, endpoint, bucket/object key và thuật ngữ chuyên môn như `raw`, `processed`, `best-effort`, `transcode`, `cleanup`.
- Ví dụ đúng: dùng một participant `MinIO Storage`, message ghi rõ thao tác với `bucket raw` hoặc `bucket processed`.
- Ví dụ sai: tạo riêng `MinIO Raw` và `MinIO Processed`, vì dễ bị hiểu nhầm là hai storage service khác nhau.

## Tải video lên

```mermaid
sequenceDiagram
    autonumber
    actor NguoiTao as Người tạo
    participant Media as Media Service
    participant Storage as MinIO Storage
    participant Kafka
    participant Moderation as Moderation Service
    participant Processor as Video Processor

    NguoiTao->>Media: Init upload
    Media-->>NguoiTao: videoId + presigned upload URL
    NguoiTao->>Storage: Upload raw video vào bucket raw

    NguoiTao->>Media: Confirm upload
    Media->>Storage: Copy raw draft sang raw confirmed trong bucket raw
    Media->>Storage: Delete raw draft best-effort
    Media->>Kafka: Publish video.moderation.requested
    Media-->>NguoiTao: Chờ kiểm duyệt

    Kafka-->>Moderation: video.moderation.requested
    Moderation->>Storage: Read raw confirmed từ bucket raw
    Moderation->>Kafka: Publish video.moderation.completed

    Kafka-->>Media: video.moderation.completed

    alt SAFE
        Media->>Processor: Queue transcode job
        Processor->>Storage: Read raw confirmed từ bucket raw
        Processor->>Storage: Write HLS, segments, thumbnail vào bucket processed
        Processor->>Kafka: Publish video.processed.success
        Kafka-->>Media: video.processed.success
        Media->>Media: Mark video READY
        Media->>Storage: Delete raw confirmed best-effort khỏi bucket raw
    else REJECTED hoặc moderation failed
        Media->>Media: Mark video REJECTED/FAILED
        Note over Media,Storage: Raw được giữ lại cho cleanup failed/rejected.
    else Processing failed
        Processor->>Kafka: Publish video.processed.failed
        Kafka-->>Media: video.processed.failed
        Media->>Media: Mark video FAILED
        Note over Media,Storage: Raw được giữ lại cho cleanup failed video.
    end
```

### Vòng đời file raw

- `uploads/raw/{channelId}/...` được tạo khi khởi tạo upload và dùng cho URL upload của client.
- Khi xác nhận upload, raw draft được sao chép sang `uploads/confirmed/{videoId}/...`, sau đó raw draft được xóa best-effort.
- Sau `video.processed.success`, Media Service xóa raw confirmed best-effort sau khi video được đánh dấu `READY`.
- Nếu xóa trên MinIO lỗi, playback vẫn chạy từ `media-processed`; raw có thể còn lại để cleanup thủ công hoặc lifecycle cleanup.
- Video failed, rejected, draft bị hủy, draft hết hạn và hard-deleted dùng các luồng cleanup raw riêng.
- Diagram chỉ dùng một `MinIO Storage`; `raw` và `processed` là các bucket/object namespace khác nhau trong cùng storage service.
