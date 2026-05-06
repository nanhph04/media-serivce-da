import type {
  VideoStatus,
  VideoVisibility,
} from '../../domain/entities/video.entity';

export interface GetStudioVideosQuery {
  userId: string;
  limit: number;
  statuses?: VideoStatus[];
  visibilities?: VideoVisibility[];
}
