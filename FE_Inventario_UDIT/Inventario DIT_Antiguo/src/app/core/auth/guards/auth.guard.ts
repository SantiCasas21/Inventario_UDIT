import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { of, switchMap } from 'rxjs';

export const AuthGuard: CanActivateFn | CanActivateChildFn = (route, state) =>
{
    const router: Router = inject(Router);
    const authService = inject(AuthService);
    const userService = inject(UserService);

    // Check the authentication status
    return authService.check().pipe(
        switchMap((authenticated) =>
        {
            // If the user is not authenticated...
            if ( !authenticated )
            {
                // Redirect to the sign-in page with a redirectUrl param
                const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
                const urlTree = router.parseUrl(`sign-in?${redirectURL}`);

                return of(urlTree);
            }

            // Si el usuario tiene una contraseña temporal y debe cambiarla obligatoriamente:
            const currentUser = userService.currentUser;
            const targetUrl = state.url.split('?')[0];
            if (currentUser?.debeCambiarPassword)
            {
                if (targetUrl !== '/cambiar-password-inicial' && targetUrl !== '/sign-out')
                {
                    return of(router.parseUrl('/cambiar-password-inicial'));
                }
            }

            // Allow the access
            return of(true);
        }),
    );
};
