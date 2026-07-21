import { StockCriticoDto } from './reporte.models';
import { MovimientoDto } from './movimiento.models';

/** DTO para el Dashboard principal. Métricas clave del inventario en una sola llamada. */
export interface DashboardDto {
  // Totales
  totalInsumos: number;
  totalProyectos: number;
  totalProveedores: number;
  totalMovimientos: number;
  // Movimientos recientes
  movimientosHoy: number;
  movimientosEsteMes: number;
  ingresosHoy: number;
  salidasHoy: number;
  // Stock bajo
  stockBajoCount: number;
  stockBajo: StockCriticoDto[];
  // Últimos movimientos
  ultimosMovimientos: MovimientoDto[];
  // Irregularidades
  irregularidades: IrregularidadDto[];
}

/** DTO para una irregularidad o anomalía detectada. */
export interface IrregularidadDto {
  tipo: string;
  descripcion: string;
  insumoRef: string | null;
  severidad: string; // "alta", "media", "info"
}
