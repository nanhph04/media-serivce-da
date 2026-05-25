export const ERROR_MESSAGES = {
  ADMIN_ROLE_REQUIRED: 'Admin role is required',
  VIDEO_NOT_FOUND: 'Video not found',
  VIDEO_NOT_OWNED: 'You do not own this video',
  VIDEO_NOT_DRAFT: 'Video is not in draft status',
  VIDEO_CANNOT_MARK_PROCESSING: 'Video cannot be marked as processing',
  VIDEO_NOT_PENDING_MANUAL_REVIEW: 'Video is not pending manual review',
  VIDEO_NO_REQUESTED_RESOLUTIONS:
    'Video has no requested processing resolutions',
  VIDEO_RESOLUTION_REQUIRED: 'At least one video resolution is required',
  VIDEO_REJECTION_REASON_REQUIRED: 'Rejection reason is required',
  VIDEO_READY_REQUIRED_FOR_UNPUBLISH: 'Only ready videos can be unpublished',
  VIDEO_DELETE_ALREADY_REQUESTED: 'Video delete has already been requested',
  VIDEO_NOT_PENDING_DELETE: 'Video is not pending delete',
  VIDEO_PRICE_NEGATIVE: 'Video price cannot be negative',
  VIDEO_PRICE_DIVISIBLE_BY_10: 'Video price must be divisible by 10',
  VIDEO_TITLE_REQUIRED_MAX_LENGTH:
    'Video title is required and must be <= 200 characters',
  RAW_UPLOAD_FILE_NOT_FOUND: 'Raw upload file not found',
  UPLOADED_VIDEO_EMPTY_OR_INVALID: 'Uploaded video file is empty or invalid',
  VIDEO_FILE_EXCEEDS_MAX_UPLOAD_SIZE: 'Video file exceeds maximum upload size',
  THUMBNAIL_OBJECT_KEY_INVALID: 'Thumbnail object key is invalid',
  THUMBNAIL_FILE_TYPE_INVALID: 'Thumbnail file type is invalid',
  THUMBNAIL_UPLOAD_FILE_NOT_FOUND: 'Thumbnail upload file not found',
  THUMBNAIL_EMPTY_OR_EXCEEDS_LIMIT:
    'Thumbnail file is empty or exceeds 5MB',
} as const;
