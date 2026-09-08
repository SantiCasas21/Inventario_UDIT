import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { environment } from '@env/environment';
import { catchError, Observable, throwError } from 'rxjs';

/**
 * Interceptor HTTP que:
 * - Agrega el header Authorization: Bearer {token} a las llamadas a la API
 * - Maneja respuestas 401 → sign out + reload
 */
export const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Solo interceptar llamadas a la API del backend
  const isApiRequest = req.url.startsWith(environment.API_BASE_URL);

  if (!isApiRequest) {
    return next(req);
  }

  // No enviar tokens previos en endpoints públicos de autenticación
  const isPublicAuth = req.url.includes('/auth/login') || (req.url.includes('/auth/register') && !authService.accessToken);
  const token = !isPublicAuth ? authService.accessToken : null;
  let newReq = req;

  if (token) {
    newReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
  }


  return next(newReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.signOut();
        location.reload();
      }
      return throwError(() => error);
    })
  );
};
