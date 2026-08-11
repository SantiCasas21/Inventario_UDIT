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
  ubicacionesStock: StockUbicacionDto[];
  descripcion: string | null;
  precioReferencia: number | null;
  moneda: string | null;
  valorMedida: number | null;
  unidadMedida: string | null;
  cantidad: number;
}

/** DTO para crear/actualizar un Insumo. */
export interface InsumoRequest {
  idCategoria: number;
  codigoFabrica: string;
  idEmpaquetamiento: number;
  descripcion?: string;
  precioReferencia?: number;
  moneda?: string;
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
  /** Multi-select de insumos (IDs) */
  idsInsumo?: number[];
  /** Multi-select de empaquetamientos (IDs) */
  idsEmpaquetamiento?: number[];
  /** Multi-select de ubicaciones (IDs) */
  idsUbicacion?: number[];
  /** Multi-select de unidades de medida (nombres) */
  unidadesMedida?: string[];
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

export interface StockUbicacionDto {
  idUbicacion: number;
  ubicacionNombre: string;
  stock: number;
}
