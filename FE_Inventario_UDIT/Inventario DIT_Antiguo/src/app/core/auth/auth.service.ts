import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, catchError, map, timeout } from 'rxjs';
import { UserService } from 'app/core/user/user.service';
import { LoginRequest, LoginResponse, UserInfo } from '@app/core/models';
import { environment } from '@env/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _authenticated = false;
  private _http = inject(HttpClient);
  private _userService = inject(UserService);
  private _baseUrl = environment.API_BASE_URL;

  set accessToken(token: string) {
    localStorage.setItem('accessToken', token);
  }

  get accessToken(): string {
    return localStorage.getItem('accessToken') ?? '';
  }

  get isAuthenticated(): boolean {
    return this._authenticated;
  }

  /**
   * Sign in — llamada directa con HttpClient para evitar capas innecesarias.
   * El backend responde { success, message, data: { token, expiration, username, nombreCompleto, role } }
   */
  signIn(credentials: LoginRequest): Observable<LoginResponse> {
    if (this._authenticated) {
      return throwError(() => new Error('Ya hay sesión activa.'));
    }

    console.log('[Auth] Enviando login a:', `${this._baseUrl}/auth/login`, credentials);

    return this._http.post<{ success: boolean; message: string; data: LoginResponse }>(
      `${this._baseUrl}/auth/login`,
      credentials
    ).pipe(
      timeout(15000),
      map(res => {
        console.log('[Auth] Respuesta cruda del backend:', JSON.stringify(res));

        if (!res || !res.success) {
          throw new Error(res?.message || 'Credenciales inválidas');
        }
        if (!res.data || !res.data.token) {
          throw new Error('El servidor no devolvió un token válido. Respuesta: ' + JSON.stringify(res));
        }

        const login = res.data;
        this.accessToken = login.token;
        this._authenticated = true;
        this._userService.user = {
          id: '',
          name: login.nombreCompleto,
          username: login.username,
          email: '',
          nombreCompleto: login.nombreCompleto,
          role: login.role,
          activo: true,
          fechaCreacion: '',
        };

        console.log('[Auth] Login exitoso. Token guardado, rol:', login.role);
        return login;
      }),
      catchError(err => {
        console.error('[Auth] Error en login:', err);
        let msg: string;
        if (err?.name === 'TimeoutError') {
          msg = 'El servidor no responde. Verifica que el backend esté corriendo en ' + this._baseUrl;
        } else if (err?.status === 0) {
          msg = 'No hay conexión con el servidor. ¿Está corriendo el backend en ' + this._baseUrl + '?';
        } else {
          msg = err?.message || err?.error?.message || 'Error de conexión con el servidor';
        }
        return throwError(() => new Error(msg));
      })
    );
  }

  /**
   * Valida token contra GET /api/auth/me
   */
  validateToken(): Observable<UserInfo> {
    if (!this.accessToken) {
      return throwError(() => new Error('No hay token.'));
    }

    return this._http.get<{ success: boolean; data: UserInfo }>(`${this._baseUrl}/auth/me`).pipe(
      timeout(10000),
      map(res => {
        if (!res?.success || !res?.data) throw new Error('Token inválido o expirado.');
        const u = res.data;
        this._authenticated = true;
        this._userService.user = {
          id: u.id, name: u.nombreCompleto, username: u.username,
          email: u.email, nombreCompleto: u.nombreCompleto, role: u.role,
          activo: u.activo, fechaCreacion: u.fechaCreacion,
        };
        return u;
      }),
      catchError(err => {
        this.signOut();
        return throwError(() => err);
      })
    );
  }

  signOut(): Observable<boolean> {
    localStorage.removeItem('accessToken');
    this._authenticated = false;
    this._userService.user = null;
    return of(true);
  }

  signUp(data: { username: string; email: string; password: string; nombreCompleto: string; role: string }): Observable<LoginResponse> {
    return this._http.post<{ success: boolean; message?: string; data: LoginResponse }>(
      `${this._baseUrl}/auth/register`, data
    ).pipe(
      map(res => {
        if (!res?.success || !res?.data) throw new Error(res?.message || 'Error al crear usuario.');
        return res.data;
      })
    );
  }

  register(data: { username: string; email: string; password: string; nombreCompleto: string; role: string }): Observable<LoginResponse> {
    return this.signUp(data);
  }

  check(): Observable<boolean> {
    if (this._authenticated) return of(true);
    if (!this.accessToken) return of(false);
    return this.validateToken().pipe(map(() => true), catchError(() => of(false)));
  }
}
