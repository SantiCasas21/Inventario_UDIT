// ==========================================
// Modelos de Movimientos de Inventario (Kardex)
// ==========================================

export type TipoMovimiento = 'Ingreso' | 'Salida' | 'Ajuste';

export interface MovimientoDto {
  id: number;
  tipoMovimiento: TipoMovimiento;
  fecha: string; // ISO 8601 string
  idInsumo: number;
  insumoCodigo: string;
  insumoDescripcion?: string | null;
  cantidad: number;
  precioUnitario?: number | null;
  moneda: string;
  idUbicacion: number;
  ubicacionNombre: string;
  idProyecto?: number | null;
  proyectoNombre?: string | null;
  idPersonal?: number | null;
  personalNombre?: string | null;
  idProveedor?: number | null;
  proveedorNombre?: string | null;
  idTipoCompra?: number | null;
  tipoCompraNombre?: string | null;
  idEstadoSalida?: number | null;
  estadoSalidaNombre?: string | null;
  observacion?: string | null;
  usuarioRegistro: string;
}

export interface MovimientoRequest {
  idInsumo: number;
  cantidad: number;
  precioUnitario?: number | null;
  moneda?: string;
  idUbicacion: number;
  idNuevaUbicacion?: number;
  idProyecto?: number | null;
  idPersonal?: number | null;
  idProveedor?: number | null;
  idTipoCompra?: number | null;
  idEstadoSalida?: number | null;
  observacion?: string | null;
  usuarioRegistro?: string;
}

export interface MovimientoFilterParams {
  page?: number;
  pageNumber?: number;
  pageSize?: number;
  tipoMovimiento?: TipoMovimiento;
  tiposMovimiento?: string[];
  idInsumo?: number;
  idsInsumo?: number[];
  idsCategoria?: number[];
  idProyecto?: number;
  idsProyecto?: number[];
  idUbicacion?: number;
  idProveedor?: number;
  idsProveedor?: number[];
  idsTipoCompra?: number[];
  idsEstadoSalida?: number[];
  idPersonal?: number;
  fechaDesde?: string;
  fechaHasta?: string;
  cantidadMin?: number;
  cantidadMax?: number;
  codigoFabricaSearch?: string;
  textSearch?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export type MovimientoFilter = MovimientoFilterParams;

export interface StockDto {
  idUbicacion: number;
  ubicacionNombre: string;
  stock: number;
}

export interface UbicacionStockOption {
  idUbicacion: number;
  ubicacionNombre: string;
  stock: number;
}

/** Fila individual previsualizada para ingreso masivo desde Excel */
export interface IngresoPreviewItemDto {
  fila: number;
  codigoFabrica: string;
  insumoExiste: boolean;
  idInsumo?: number;
  descripcion?: string | null;
  cantidad: number;
  precioUnitario?: number | null;
  
  // Categoría
  idCategoria?: number | null;
  categoriaNombre?: string | null;
  categoriaTextoExcel?: string | null;
  categoriaExiste?: boolean;

  // Empaquetamiento
  idEmpaquetamiento?: number | null;
  empaquetamientoNombre?: string | null;
  empaquetamientoTextoExcel?: string | null;
  empaquetamientoExiste?: boolean;

  // Medidas
  valorMedida?: number | null;
  unidadMedida?: string | null;

  // Ubicaciones
  idUbicacion?: number | null;
  ubicacionNombre?: string | null;
  ubicacionesDisponibles: UbicacionStockOption[];

  // Proveedor
  idProveedor?: number | null;
  proveedorNombre?: string | null;
  proveedorTextoExcel?: string | null;
  proveedorExiste?: boolean;

  // Tipo Compra
  idTipoCompra?: number | null;
  tipoCompraNombre?: string | null;
  tipoCompraTextoExcel?: string | null;
  tipoCompraExiste?: boolean;

  // Observación y Control
  observacion?: string | null;
  esDuplicadoEnLote?: boolean;
  estadoValidacion: 'OK' | 'REQUIERE_UBICACION' | 'INSUMO_NO_REGISTRADO' | 'PROVEEDOR_NO_REGISTRADO' | 'CATEGORIA_NO_REGISTRADA' | 'EMPAQUETAMIENTO_NO_REGISTRADO' | 'CANTIDAD_INVALIDA';
  mensajeError?: string | null;
}

/** Respuesta consolidada de la previsualización del archivo Excel */
export interface IngresoPreviewResponseDto {
  totalFilas: number;
  totalValidas: number;
  totalInsumosNuevos: number;
  totalProveedoresNuevos: number;
  totalCategoriasNuevas: number;
  totalEmpaquetamientosNuevos: number;
  totalDuplicados: number;
  totalInversionEstimada: number;
  filas: IngresoPreviewItemDto[];
}

/** Petición para registrar lote de ingresos */
export interface IngresoMasivoRequestDto {
  movimientos: MovimientoRequest[];
}

/** Resultado de la importación masiva */
export interface IngresoMasivoResultDto {
  totalProcesados: number;
  totalInvertido: number;
  movimientosCreados: MovimientoDto[];
  errores: string[];
}
