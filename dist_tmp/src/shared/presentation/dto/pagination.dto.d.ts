export interface PaginationDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}
export type PaginationMeta = PaginationDto;
