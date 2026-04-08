export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class PaginationUtil {
  static validateOptions(options: PaginationOptions): Required<PaginationOptions> {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10)); // Max 100 items per page
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';

    return { page, limit, sortBy, sortOrder };
  }

  static createPaginatedResult<T>(
    data: T[],
    total: number,
    options: Required<PaginationOptions>
  ): PaginatedResult<T> {
    const { page, limit } = options;
    const pages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1
      }
    };
  }

  static getPrismaOptions(options: Required<PaginationOptions>) {
    const { page, limit, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    return {
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    };
  }
}