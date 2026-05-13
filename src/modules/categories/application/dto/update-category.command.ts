export interface UpdateCategoryCommand {
  categoryId: string;
  name?: string;
  description?: string;
  parentId?: string | null;
  status?: string;
  displayOrder?: number;
}
