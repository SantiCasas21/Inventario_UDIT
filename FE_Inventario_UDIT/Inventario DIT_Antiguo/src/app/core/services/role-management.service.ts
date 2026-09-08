import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientService } from '@app/core/http/api-client.service';
import { PermissionDefinition, RolePermissions } from 'interfaces/role-permissions';

@Injectable({ providedIn: 'root' })
export class RoleManagementService {
  private endpoint = 'roles';

  constructor(private api: ApiClientService) {}

  /**
   * Obtiene el catálogo completo de permisos disponibles en el sistema.
   * Usado para construir la tabla de checkboxes y el árbol visual.
   */
  getAvailablePermissions(): Observable<PermissionDefinition[]> {
    return this.api.get<PermissionDefinition[]>(`${this.endpoint}/available-permissions`);
  }

  /**
   * Obtiene todos los roles del sistema con sus permisos asignados.
   * ApiClientService ya desenvuelve el OperationResult<T>.data automáticamente.
   */
  getAllRolesPermissions(): Observable<RolePermissions[]> {
    return this.api.get<RolePermissions[]>(`${this.endpoint}`);
  }

  /**
   * Obtiene los permisos asignados a un rol específico.
   */
  getRolePermissions(roleName: string): Observable<RolePermissions> {
    return this.api.get<RolePermissions>(`${this.endpoint}/${roleName}/permissions`);
  }

  /**
   * Reemplaza los permisos de un rol con la lista provista.
   * El rol Admin no puede ser modificado (el backend retorna error 400).
   */
  updateRolePermissions(roleName: string, permissions: string[]): Observable<void> {
    return this.api.put<void>(`${this.endpoint}/${roleName}/permissions`, { permissions });
  }
}
