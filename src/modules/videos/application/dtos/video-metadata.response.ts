import type {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';
import type { MembershipTierResponse } from '../../../channels/application/dtos/membership-tier.response';
import type { VideoJobStatusFields } from './video-job-status';

export interface VideoMetadataResponse extends VideoJobStatusFields {
  id: string;
  channelId: string;
  channelName: string;
  avatarUrlChannel: string;
  membershipTiers: MembershipTierResponse[];
  title: string;
  description: string;
  categoryId: string;
  category: string;
  tagIds: string[];
  tags: string[];
  thumbnailUrl: string | null;
  viewCount: number;
  status: VideoStatus;
  visibility: VideoVisibility;
  errorMessage: string | null;
  publishedAt: Date | null;
  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: string | null;
  deleteReason: string | null;
  updatedAt: Date;
}
