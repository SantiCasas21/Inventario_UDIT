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

  /**
   * Obtiene los registros de un catálogo filtrados por categoría.
   * Ej: getByCategoria('empaquetamiento', 3) → GET empaquetamiento/por-categoria/3
   */
  getByCategoria(endpoint: string, idCategoria: number): Observable<CatalogoDto[]> {
    return this.api.get<CatalogoDto[]>(`${endpoint}/por-categoria/${idCategoria}`);
  }

  /**
   * Obtiene los registros de un catálogo filtrados por múltiples categorías.
   * Ej: getByCategorias('empaquetamiento', [1, 2]) -> GET empaquetamiento/por-categorias?ids=1&ids=2
   */
  getByCategorias(endpoint: string, idsCategoria: number[]): Observable<CatalogoDto[]> {
    const params = idsCategoria.map(id => `ids=${id}`).join('&');
    return this.api.get<CatalogoDto[]>(`${endpoint}/por-categorias?${params}`);
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
