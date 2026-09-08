import { inject, Injectable } from '@angular/core';
import { CanActivateChild, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate, CanActivateChild {
  private router = inject(Router);
  private userService = inject(UserService);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkAccess(route);
  }

  canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    return this.checkAccess(route);
  }

  private checkAccess(route: ActivatedRouteSnapshot): boolean {
    const expectedRoles = route.data['roles'] as Array<string> | string | undefined;
    const expectedPermission = route.data['permission'] as Array<string> | string | undefined;

    // Si no hay restricciones, permitir acceso
    if (!expectedRoles && !expectedPermission) {
      return true;
    }

    if (this.userService.canAccess({ roles: expectedRoles, permission: expectedPermission })) {
      return true;
    }

    console.warn(`[RoleGuard] Acceso denegado. Permiso requerido: ${expectedPermission || 'N/A'}, Roles requeridos: ${expectedRoles || 'N/A'}`);
    this.router.navigate(['/dashboard']);
    return false;
  }
}
