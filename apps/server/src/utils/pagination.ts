export type PaginationQuery = {
  page?: number;
  limit?: number;
  offset?: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export function getPaginationParams(
  query: { page?: number; limit?: number; offset?: number },
  defaultLimit = 20,
) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.max(1, Math.min(100, query.limit ?? defaultLimit));
  const skip = query.offset !== undefined ? Math.max(0, query.offset) : (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

