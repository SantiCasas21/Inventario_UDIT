import { Injectable } from '@angular/core';
import { ApiClientService } from '../http/api-client.service';
import { Observable } from 'rxjs';
import { PagedResult } from '../models';

export interface AuditoriaDto {
  id: number;
  fecha: string;
  usuario: string;
  accion: string;
  modulo: string;
  detalles: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private endpoint = 'auditoria';

  constructor(private api: ApiClientService) {}

  getLogs(page: number = 1, pageSize: number = 20, textSearch: string = '', modulo: string = ''): Observable<PagedResult<AuditoriaDto>> {
    const params: any = { page, pageSize };
    if (textSearch) params.textSearch = textSearch;
    if (modulo) params.modulo = modulo;
    
    return this.api.get<PagedResult<AuditoriaDto>>(this.endpoint, params);
  }
}
