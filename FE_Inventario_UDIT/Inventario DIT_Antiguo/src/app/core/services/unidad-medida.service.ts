import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@app/core/http/api-client.service';

export interface UnidadMedidaDto {
  id: number;
  nombre: string;
  idCategoria: number;
}

export interface UnidadMedidaRequestDto {
  nombre: string;
  idCategoria: number;
}

@Injectable({ providedIn: 'root' })
export class UnidadMedidaService {
  private endpoint = 'unidad-medida';

  constructor(private api: ApiClientService) {}

  getAll(): Observable<UnidadMedidaDto[]> {
    return this.api.get<UnidadMedidaDto[]>(this.endpoint);
  }

  getByCategoria(idCategoria: number): Observable<UnidadMedidaDto[]> {
    return this.api.get<UnidadMedidaDto[]>(`${this.endpoint}/categoria/${idCategoria}`);
  }

  getByCategorias(idsCategoria: number[]): Observable<UnidadMedidaDto[]> {
    const params = idsCategoria.map(id => `ids=${id}`).join('&');
    return this.api.get<UnidadMedidaDto[]>(`${this.endpoint}/por-categorias?${params}`);
  }

  create(data: UnidadMedidaRequestDto): Observable<UnidadMedidaDto> {
    return this.api.post<UnidadMedidaDto>(this.endpoint, data);
  }

  update(id: number, data: UnidadMedidaRequestDto): Observable<UnidadMedidaDto> {
    return this.api.put<UnidadMedidaDto>(`${this.endpoint}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }
}
