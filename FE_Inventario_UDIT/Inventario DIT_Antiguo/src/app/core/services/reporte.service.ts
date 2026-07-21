import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@app/core/http/api-client.service';
import { KardexDetalladoDto, StockCriticoDto, MovimientosPeriodoDto, ResumenProyectoDto } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private endpoint = 'reporte';

  constructor(private api: ApiClientService) {}

  /** Kardex detallado de un insumo con saldo acumulado */
  getKardex(insumoId: number, desde?: string, hasta?: string): Observable<KardexDetalladoDto[]> {
    const params: Record<string, unknown> = {};
    if (desde) params['desde'] = desde;
    if (hasta) params['hasta'] = hasta;
    return this.api.get<KardexDetalladoDto[]>(`${this.endpoint}/kardex/${insumoId}`, params);
  }

  /** Insumos con stock por debajo del umbral */
  getStockCritico(umbral?: number): Observable<StockCriticoDto[]> {
    const params: Record<string, unknown> = {};
    if (umbral !== undefined) params['umbral'] = umbral;
    return this.api.get<StockCriticoDto[]>(`${this.endpoint}/stock-critico`, params);
  }

  /** Resumen de movimientos en un periodo */
  getMovimientosPeriodo(desde?: string, hasta?: string, insumoId?: number): Observable<MovimientosPeriodoDto> {
    const params: Record<string, unknown> = {};
    if (desde) params['desde'] = desde;
    if (hasta) params['hasta'] = hasta;
    if (insumoId !== undefined) params['insumoId'] = insumoId;
    return this.api.get<MovimientosPeriodoDto>(`${this.endpoint}/movimientos`, params);
  }

  /** Resumen por proyecto (insumos retirados) */
  getResumenProyecto(proyectoId: number): Observable<ResumenProyectoDto[]> {
    return this.api.get<ResumenProyectoDto[]>(`${this.endpoint}/proyecto`, { proyectoId } as Record<string, unknown>);
  }
}
