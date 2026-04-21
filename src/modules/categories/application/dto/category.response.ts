export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
