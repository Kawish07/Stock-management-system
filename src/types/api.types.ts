export interface ERPNextListResponse<T> {
  data: T[];
}

/** Single-document response from /api/resource/{doctype}/{name} */
export interface ERPNextSingleResponse<T> {
  data: T;
}

/** @deprecated Use ERPNextSingleResponse — kept for backwards compat */
export type ERPNextDocResponse<T> = ERPNextSingleResponse<T>;

export interface ERPNextError {
  exc_type: string;
  exc: string;
  message: string;
  indicator?: string;
  title?: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: string;
  orderBy?: string;
  fields?: string[];
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}
