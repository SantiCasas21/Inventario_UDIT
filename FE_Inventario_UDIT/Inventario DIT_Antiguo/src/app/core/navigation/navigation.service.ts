import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NAVIGATION_ITEMS } from 'app/core/navigation/navigation.data';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private _navigation: Navigation = {
    default: NAVIGATION_ITEMS,
    compact: NAVIGATION_ITEMS,
    futuristic: NAVIGATION_ITEMS,
    horizontal: NAVIGATION_ITEMS,
  };

  /** Getter for navigation as Observable */
  get navigation$(): Observable<Navigation> {
    return of(this._navigation);
  }

  /** Returns navigation data directly (para compatibilidad con resolvers) */
  get(): Observable<Navigation> {
    return of(this._navigation);
  }
}
