export interface CreateCategoryCommand {
  name: string;
  description?: string;
  parentId?: string | null;
  displayOrder?: number;
}
