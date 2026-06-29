export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextCursor?: string;
  prevCursor?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export const createSuccessResponse = <T>(
  data: T,
  meta?: PaginationMeta,
  message?: string
): ApiResponse<T> => ({
  success: true,
  data,
  meta,
  message,
});

export const createErrorResponse = (
  message: string,
  code?: string,
  details?: unknown
): ApiErrorResponse => ({
  success: false,
  error: { message, code, details },
});

export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number,
  nextCursor?: string,
  prevCursor?: string
): PaginationMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
  nextCursor,
  prevCursor,
});