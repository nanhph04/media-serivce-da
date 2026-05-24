import type { PaginatedResponse } from '@shared/application/dtos/paginated.response';
import type { ContinueWatchingItemResponse } from './continue-watching-item.response';

export type ContinueWatchingResponse =
  PaginatedResponse<ContinueWatchingItemResponse>;
