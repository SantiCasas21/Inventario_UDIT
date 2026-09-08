import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@app/core/http/api-client.service';
import { UserDto, CreateUserAdminRequest } from '@app/core/models';

@Injectable({ providedIn: 'root' })
export class UserManagementService {
  private endpoint = 'user';

  constructor(private api: ApiClientService) {}

  /** Listar todos los usuarios con sus roles */
  getAll(): Observable<UserDto[]> {
    return this.api.get<UserDto[]>(this.endpoint);
  }

  /** Crear un nuevo usuario (solo Admin / usuarios.gestionar) */
  create(data: CreateUserAdminRequest): Observable<UserDto> {
    return this.api.post<UserDto>(this.endpoint, data);
  }

  /** Obtener detalle de un usuario */
  getById(id: string): Observable<UserDto> {

    return this.api.get<UserDto>(`${this.endpoint}/${id}`);
  }

  /** Actualizar rol asignado a un usuario */
  updateRole(id: string, role: string): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}/role`, { role });
  }

  /** Desactivar usuario (soft-delete) */
  deactivate(id: string): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}/deactivate`);
  }

  /** Reactivar usuario */
  activate(id: string): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${id}/activate`);
  }

  /** Eliminar usuario permanentemente */
  delete(id: string): Observable<void> {
    return this.api.delete(`${this.endpoint}/${id}`);
  }
}

