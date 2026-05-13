export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId: string | null;
  status: string;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
