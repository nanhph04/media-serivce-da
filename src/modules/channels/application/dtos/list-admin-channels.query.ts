export interface ListAdminChannelsQuery {
  adminId: string;
  role: string | undefined;
  page?: number;
  limit?: number;
  status?: string;
  ownerId?: string;
  q?: string;
}
