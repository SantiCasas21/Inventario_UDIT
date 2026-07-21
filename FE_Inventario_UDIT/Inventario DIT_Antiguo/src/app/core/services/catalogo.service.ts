import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@app/core/http/api-client.service';
import { CatalogoDto, CatalogoRequestDto } from '@app/core/models';

/**
 * Servicio genérico para CRUD de catálogos.
 * Reemplaza 8 servicios individuales antiguos:
 * empaquetamiento, estadoproyecto, estadosalida, nombreinsumo,
 * personal, tipocompra, ubicaciones, proveedor (básico).
 */
@Injectable({ providedIn: 'root' })
export class CatalogoService {
  constructor(private api: ApiClientService) {}

  getAll(endpoint: string): Observable<CatalogoDto[]> {
    return this.api.get<CatalogoDto[]>(endpoint);
  }

  getById(endpoint: string, id: number): Observable<CatalogoDto> {
    return this.api.get<CatalogoDto>(`${endpoint}/${id}`);
  }

  create(endpoint: string, data: CatalogoRequestDto): Observable<CatalogoDto> {
    return this.api.post<CatalogoDto>(endpoint, data);
  }

  update(endpoint: string, id: number, data: CatalogoRequestDto): Observable<CatalogoDto> {
    return this.api.put<CatalogoDto>(`${endpoint}/${id}`, data);
  }

  delete(endpoint: string, id: number): Observable<void> {
    return this.api.delete(`${endpoint}/${id}`);
  }
}
