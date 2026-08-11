import { inject, Injectable } from '@angular/core';
import { CanActivateChild, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate, CanActivateChild {
  private router = inject(Router);
  private userService = inject(UserService);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkRole(route);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkRole(route);
  }

  private checkRole(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['roles'] as Array<string>;
    if (!expectedRoles || expectedRoles.length === 0) {
      return true;
    }

    if (this.userService.hasRole(expectedRoles)) {
      return true;
    }

    console.warn(`[RoleGuard] Acceso denegado. Se requiere: ${expectedRoles}`);
    this.router.navigate(['/dashboard']);
    return false;
  }
}
