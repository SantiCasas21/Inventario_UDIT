import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NAVIGATION_ITEMS } from 'app/core/navigation/navigation.data';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { Observable, of } from 'rxjs';
import { UserService } from '@app/core/user/user.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private userService = inject(UserService);

  /**
   * Filtra recursivamente cada elemento de navegación según los permisos y roles del usuario actual.
   * Si un menú colapsable no contiene hijos accesibles, se omite automáticamente.
   */
  private filterItem(item: FuseNavigationItem): FuseNavigationItem | null {
    if (item.children && item.children.length > 0) {
      const filteredChildren = item.children
        .map(child => this.filterItem(child))
        .filter((child): child is FuseNavigationItem => child !== null);

      if (filteredChildren.length === 0) {
        return null;
      }

      return {
        ...item,
        children: filteredChildren
      };
    }

    if (item.meta) {
      const permission = item.meta.permission;
      const roles = item.meta.roles;
      if (!this.userService.canAccess({ permission, roles })) {
        return null;
      }
    }

    return item;
  }

  private getFilteredNavigation(): FuseNavigationItem[] {
    return NAVIGATION_ITEMS
      .map(item => this.filterItem(item))
      .filter((item): item is FuseNavigationItem => item !== null);
  }

  /** Getter for navigation as Observable */
  get navigation$(): Observable<Navigation> {
    const filtered = this.getFilteredNavigation();
    return of({
      default: filtered,
      compact: filtered,
      futuristic: filtered,
      horizontal: filtered,
    });
  }

  /** Returns navigation data directly (para compatibilidad con resolvers) */
  get(): Observable<Navigation> {
    const filtered = this.getFilteredNavigation();
    return of({
      default: filtered,
      compact: filtered,
      futuristic: filtered,
      horizontal: filtered,
    });
  }
}
