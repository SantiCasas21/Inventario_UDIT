import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { User } from 'app/core/user/user.types';

@Injectable({ providedIn: 'root' })
export class UserService {
  private _user: ReplaySubject<User> = new ReplaySubject<User>(1);
  private _currentUser: User | null = null;

  /** Setter & getter for user */
  set user(value: User | null) {
    this._currentUser = value;
    if (value) {
      this._user.next(value);
    }
  }

  get currentUser(): User | null {
    return this._currentUser;
  }

  get user$(): Observable<User> {
    return this._user.asObservable();
  }

  /**
   * Verifica si el usuario actual posee alguno de los roles indicados.
   */
  hasRole(roles: string | string[]): boolean {
    if (!this._currentUser || !this._currentUser.role) {
      return false;
    }
    const userRole = this._currentUser.role.toLowerCase();
    if (Array.isArray(roles)) {
      return roles.some(r => r.toLowerCase() === userRole);
    }
    return userRole === roles.toLowerCase();
  }

  /**
   * Verifica si el usuario actual posee un permiso específico (claim).
   * El rol Admin siempre tiene acceso total.
   */
  hasPermission(permissions: string | string[]): boolean {
    if (!this._currentUser) {
      return false;
    }
    if (this._currentUser.role?.toLowerCase() === 'admin') {
      return true;
    }

    const userPerms = (this._currentUser.permissions || []).map(p => p.toLowerCase());
    if (Array.isArray(permissions)) {
      return permissions.some(p => userPerms.includes(p.toLowerCase()));
    }
    return userPerms.includes(permissions.toLowerCase());
  }

  /**
   * Determina si el usuario puede acceder según las reglas de roles o permisos especificadas.
   */
  canAccess(rule: { roles?: string | string[]; permission?: string | string[] }): boolean {
    if (!rule.roles && !rule.permission) {
      return true;
    }
    if (rule.permission && this.hasPermission(rule.permission)) {
      return true;
    }
    if (rule.roles && this.hasRole(rule.roles)) {
      return true;
    }
    return false;
  }

  /** Actualiza los datos del usuario localmente */
  update(userData: Partial<User>): void {
    if (this._currentUser) {
      this._currentUser = { ...this._currentUser, ...userData };
      this._user.next(this._currentUser);
    }
  }
}
