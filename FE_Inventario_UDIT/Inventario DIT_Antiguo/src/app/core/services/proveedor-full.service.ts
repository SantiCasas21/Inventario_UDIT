import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@app/core/http/api-client.service';
import { ProveedorFullDto, ProveedorFullRequest } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ProveedorFullService {
  private endpoint = 'proveedor-full';

  constructor(private api: ApiClientService) {}

  getAll(): Observable<ProveedorFullDto[]> {
    return this.api.get<ProveedorFullDto[]>(this.endpoint);
  }

  getById(id: number): Observable<ProveedorFullDto> {
    return this.api.get<ProveedorFullDto>(`${this.endpoint}/${id}`);
  }

  create(data: ProveedorFullRequest): Observable<ProveedorFullDto> {
    return this.api.post<ProveedorFullDto>(this.endpoint, data);
  }

  update(id: number, data: ProveedorFullRequest): Observable<ProveedorFullDto> {
    return this.api.put<ProveedorFullDto>(`${this.endpoint}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }
}
