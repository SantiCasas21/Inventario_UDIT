import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@app/core/http/api-client.service';
import { MovimientoDto, MovimientoRequest, MovimientoFilter, StockDto, PagedResult } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class MovimientoService {
  private endpoint = 'movimiento';

  constructor(private api: ApiClientService) {}

  /** Registrar un ingreso */
  registrarIngreso(data: MovimientoRequest): Observable<MovimientoDto> {
    return this.api.post<MovimientoDto>(`${this.endpoint}/ingreso`, data);
  }

  /** Registrar una salida */
  registrarSalida(data: MovimientoRequest): Observable<MovimientoDto> {
    return this.api.post<MovimientoDto>(`${this.endpoint}/salida`, data);
  }

  /** Registrar un ajuste */
  registrarAjuste(data: MovimientoRequest): Observable<MovimientoDto> {
    return this.api.post<MovimientoDto>(`${this.endpoint}/ajuste`, data);
  }

  /** Filtrar movimientos */
  filter(filter: MovimientoFilter): Observable<PagedResult<MovimientoDto>> {
    return this.api.post<PagedResult<MovimientoDto>>(`${this.endpoint}/filter`, filter);
  }

  /** Obtener movimientos de un insumo específico */
  getByInsumo(insumoId: number, limite?: number): Observable<MovimientoDto[]> {
    const params = limite ? { limite } : {};
    return this.api.get<MovimientoDto[]>(`${this.endpoint}/insumo/${insumoId}`, params as Record<string, unknown>);
  }

  /** Stock de un insumo específico */
  getStock(insumoId: number): Observable<StockDto> {
    return this.api.get<StockDto>(`${this.endpoint}/stock/${insumoId}`);
  }

  /** Stock de todos los insumos */
  getStockGeneral(): Observable<StockDto[]> {
    return this.api.get<StockDto[]>(`${this.endpoint}/stock`);
  }
}
