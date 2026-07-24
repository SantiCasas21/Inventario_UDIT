// ==========================================
// DTOs de Insumo
// ==========================================

/** DTO para mostrar un Insumo con nombres de catálogos resueltos. */
export interface InsumoDto {
  id: number;
  idCategoria: number;
  categoriaNombre: string;
  codigoFabrica: string;
  idEmpaquetamiento: number;
  empaquetamientoNombre: string;
  idUbicacion: number;
  ubicacionNombre: string;
  descripcion: string | null;
  precioReferencia: number | null;
  valorMedida: number | null;
  unidadMedida: string | null;
  cantidad: number;
}

/** DTO para crear/actualizar un Insumo. */
export interface InsumoRequest {
  idCategoria: number;
  codigoFabrica: string;
  idEmpaquetamiento: number;
  idUbicacion: number;
  descripcion?: string;
  precioReferencia?: number;
  valorMedida?: number;
  unidadMedida?: string;
}

// ==========================================
// Filtro de Insumo (InsumoFilterDto)
// ==========================================

/** Filtro compuesto para Insumos. Todos los campos son opcionales. Se combinan con AND. */
export interface InsumoFilter {
  /** Multi-select de categorías (IDs) */
  idsCategoria?: number[];
  /** Multi-select de empaquetamientos (IDs) */
  idsEmpaquetamiento?: number[];
  /** Multi-select de ubicaciones (IDs) */
  idsUbicacion?: number[];
  /** Valor de medida mínimo */
  valorMedidaMin?: number;
  /** Valor de medida máximo */
  valorMedidaMax?: number;
  /** Búsqueda en CódigoFabrica y Descripción (OR, contiene) */
  textSearch?: string;
  /** Página actual (default 1) */
  page?: number;
  /** Registros por página (default 20) */
  pageSize?: number;
  /** Campo de orden: "CodigoFabrica" | "Descripcion" | "PrecioReferencia" | "Categoria" | "Empaquetamiento" | "Ubicacion" */
  sortBy?: string;
  /** Orden descendente */
  sortDescending?: boolean;
}
