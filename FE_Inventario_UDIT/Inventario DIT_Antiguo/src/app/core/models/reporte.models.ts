import { MovimientoDto } from './movimiento.models';

/** DTO para el Kardex detallado de un insumo: cada movimiento con saldo acumulado. */
export interface KardexDetalladoDto {
  idMovimiento: number;
  fecha: string; // ISO 8601
  tipoMovimiento: string;
  cantidad: number;
  observacion: string | null;
  proveedor: string | null;
  proyecto: string | null;
  ubicacion?: string | null;
  /** Saldo después de este movimiento */
  saldoAcumulado: number;
}

/** DTO para reporte de stock crítico (insumos por debajo del umbral). */
export interface StockCriticoDto {
  idInsumo: number;
  codigoFabrica: string;
  descripcion: string | null;
  categoria: string;
  ubicacion: string;
  stockActual: number;
  umbral: number;
}

/** DTO para resumen de movimientos en un período. */
export interface MovimientosPeriodoDto {
  totalIngresos: number;
  totalSalidas: number;
  totalAjustes: number;
  cantidadIngresada: number;
  cantidadSalida: number;
  movimientos: MovimientoDto[];
}

/** DTO para una fila del resumen por proyecto. */
export interface InsumoResumenDto {
  idInsumo: number;
  codigoFabrica: string;
  descripcion?: string | null;
  cantidadRetirada: number;
  precioUnitarioPromedio?: number;
  costoTotal?: number;
}

/** DTO para resumen por proyecto (cuánto se gastó y valor económico invertido). */
export interface ResumenProyectoDto {
  idProyecto: number;
  proyectoNombre: string;
  estadoNombre?: string;
  esCostoFijo?: boolean;
  totalMovimientos: number;
  totalUnidadesRetiradas: number;
  costoTotalProyecto?: number;
  moneda?: string;
  insumos: InsumoResumenDto[];
}
