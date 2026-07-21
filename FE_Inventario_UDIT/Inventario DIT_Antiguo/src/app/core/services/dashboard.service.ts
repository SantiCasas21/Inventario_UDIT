import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@app/core/http/api-client.service';
import { DashboardDto } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private endpoint = 'dashboard';

  constructor(private api: ApiClientService) {}

  /** Obtener todas las métricas del dashboard en una sola llamada */
  getDashboard(): Observable<DashboardDto> {
    return this.api.get<DashboardDto>(this.endpoint);
  }
}
