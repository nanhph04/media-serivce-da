export interface ListAdminReportsQuery {
  adminId: string;
  role?: string;
  status?: string;
  targetType?: string;
  source?: string;
  page?: number;
  limit?: number;
}
