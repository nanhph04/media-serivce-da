export interface ListAdminVideosQuery {
  adminId: string;
  role?: string;
  status?: string;
  visibility?: string;
  channelId?: string;
  ownerId?: string;
  q?: string;
  page?: number;
  limit?: number;
}
