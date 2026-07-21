import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@app/core/http/api-client.service';
import { ProyectoDto, ProyectoRequest } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class ProyectoService {
  private endpoint = 'proyecto';

  constructor(private api: ApiClientService) {}

  getAll(): Observable<ProyectoDto[]> {
    return this.api.get<ProyectoDto[]>(this.endpoint);
  }

  getById(id: number): Observable<ProyectoDto> {
    return this.api.get<ProyectoDto>(`${this.endpoint}/${id}`);
  }

  create(data: ProyectoRequest): Observable<ProyectoDto> {
    return this.api.post<ProyectoDto>(this.endpoint, data);
  }

  update(id: number, data: ProyectoRequest): Observable<ProyectoDto> {
    return this.api.put<ProyectoDto>(`${this.endpoint}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }
}
