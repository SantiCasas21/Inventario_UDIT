import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NAVIGATION_ITEMS } from 'app/core/navigation/navigation.data';
import { Observable, of } from 'rxjs';
import { UserService } from '@app/core/user/user.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private userService = inject(UserService);

  private getFilteredNavigation(): any[] {
    // Si es admin o developer, ve todo. Si no, ocultamos "admin"
    if (this.userService.hasRole(['admin', 'developer'])) {
      return NAVIGATION_ITEMS;
    }
    return NAVIGATION_ITEMS.filter(item => item.id !== 'admin');
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
