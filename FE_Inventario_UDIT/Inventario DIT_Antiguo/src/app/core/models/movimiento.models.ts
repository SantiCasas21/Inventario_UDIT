// ==========================================
// DTOs de Movimiento (Kardex)
// ==========================================

/** DTO para mostrar un movimiento del Kardex con datos relacionados. */
export interface MovimientoDto {
  id: number;
  idInsumo: number;
  codigoFabrica: string;
  tipoMovimiento: 'INGRESO' | 'SALIDA' | 'AJUSTE';
  cantidad: number;
  fecha: string; // ISO 8601
  precioUnitario: number | null;
  observacion: string | null;
  // Relaciones opcionales según el tipo
  idProveedor: number | null;
  proveedorNombre: string | null;
  idTipoCompra: number | null;
  tipoCompraNombre: string | null;
  idProyecto: number | null;
  proyectoNombre: string | null;
  idEstadoSalida: number | null;
  estadoSalidaNombre: string | null;
  insumoUbicacion?: string | null;
}

/** DTO para registrar un nuevo movimiento (ingreso, salida o ajuste). */
export interface MovimientoRequest {
  idInsumo: number;
  cantidad: number;
  precioUnitario?: number;
  observacion?: string;
  // Para INGRESO
  idProveedor?: number;
  idTipoCompra?: number;
  // Para SALIDA
  idProyecto?: number;
  idEstadoSalida?: number;
}

/** DTO para mostrar el stock calculado de un insumo. */
export interface StockDto {
  idInsumo: number;
  codigoFabrica: string;
  descripcion: string | null;
  stockActual: number;
  totalIngresos: number;
  totalSalidas: number;
}

// ==========================================
// Filtro de Movimiento (MovimientoFilterDto)
// ==========================================

/** Filtro compuesto para Movimientos. Todos los campos son opcionales. Se combinan con AND. */
export interface MovimientoFilter {
  /** Tipos de movimiento: "INGRESO", "SALIDA", "AJUSTE" */
  tiposMovimiento?: string[];
  /** Multi-select de categorías (IDs) */
  idsCategoria?: number[];
  /** Multi-select de insumos (IDs) */
  idsInsumo?: number[];
  /** Multi-select de proveedores (IDs) */
  idsProveedor?: number[];
  /** Multi-select de proyectos (IDs) */
  idsProyecto?: number[];
  /** Multi-select de tipos de compra (IDs) */
  idsTipoCompra?: number[];
  /** Multi-select de estados de salida (IDs) */
  idsEstadoSalida?: number[];
  /** Cantidad mínima */
  cantidadMin?: number;
  /** Cantidad máxima */
  cantidadMax?: number;
  /** Precio unitario mínimo */
  precioUnitarioMin?: number;
  /** Precio unitario máximo */
  precioUnitarioMax?: number;
  /** Fecha desde (ISO 8601) */
  fechaDesde?: string;
  /** Fecha hasta (ISO 8601) */
  fechaHasta?: string;
  /** Búsqueda en Observación (contiene) */
  textSearch?: string;
  /** Búsqueda por Código de Fábrica (contiene) */
  codigoFabricaSearch?: string;
  /** Página actual (default 1) */
  page?: number;
  /** Registros por página (default 20) */
  pageSize?: number;
  /** Campo de orden: "Fecha" | "Cantidad" | "PrecioUnitario" | "Insumo" | "TipoMovimiento" */
  sortBy?: string;
  /** Orden descendente */
  sortDescending?: boolean;
}
