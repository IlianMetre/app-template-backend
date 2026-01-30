export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Array<{ path: string; message: string }>;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
