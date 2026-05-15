export interface ListAdminReportsQuery {
  adminId: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}
