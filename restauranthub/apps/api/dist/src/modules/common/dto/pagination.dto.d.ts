export declare class PaginationDto {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    skip?: number;
}
export declare class DateRangeDto {
    from?: string;
    to?: string;
}
export declare class PaginationWithDateRangeDto extends PaginationDto {
    from?: string;
    to?: string;
}
export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export declare function createPaginatedResponse<T>(data: T[], totalItems: number, page: number, limit: number): PaginatedResponse<T>;
