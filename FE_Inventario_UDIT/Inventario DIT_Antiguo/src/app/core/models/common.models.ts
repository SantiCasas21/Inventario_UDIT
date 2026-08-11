/** Wrapper genérico para TODAS las respuestas del backend. */
export interface OperationResult<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  /** Código de error opcional (ej: "DUPLICATE_CODE") para manejo específico en frontend */
  code?: string;
}

/** Resultado paginado para endpoints con filtro. */
export interface PagedResult<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  items: T[];
}
