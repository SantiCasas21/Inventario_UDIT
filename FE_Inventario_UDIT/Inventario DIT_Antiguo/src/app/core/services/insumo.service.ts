import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@app/core/http/api-client.service';
import { InsumoDto, InsumoRequest, InsumoFilter, PagedResult } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class InsumoService {
  private endpoint = 'insumo';

  constructor(private api: ApiClientService) {}

  /** GET con filtro por query string */
  getAllFiltered(filter: InsumoFilter): Observable<PagedResult<InsumoDto>> {
    return this.api.get<PagedResult<InsumoDto>>(this.endpoint, filter as unknown as Record<string, unknown>);
  }

  /** POST con filtro en body JSON */
  filter(filter: InsumoFilter): Observable<PagedResult<InsumoDto>> {
    return this.api.post<PagedResult<InsumoDto>>(`${this.endpoint}/filter`, filter);
  }

  getById(id: number): Observable<InsumoDto> {
    return this.api.get<InsumoDto>(`${this.endpoint}/${id}`);
  }

  create(data: InsumoRequest): Observable<InsumoDto> {
    return this.api.post<InsumoDto>(this.endpoint, data);
  }

  update(id: number, data: InsumoRequest): Observable<InsumoDto> {
    return this.api.put<InsumoDto>(`${this.endpoint}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }
}
