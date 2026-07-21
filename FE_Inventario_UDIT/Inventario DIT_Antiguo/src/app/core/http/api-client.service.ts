import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, timeout } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { OperationResult } from '@app/core/models';

const REQUEST_TIMEOUT_MS = 15000; // 15 segundos máximo

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private baseUrl = environment.API_BASE_URL;

  constructor(private http: HttpClient) {}

  private url(path: string): string {
    return `${this.baseUrl}/${path}`.replace(/([^:]\/)\/+/g, '$1');
  }

  private toParams(obj: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => { params = params.append(key, String(v)); });
        } else {
          params = params.set(key, String(value));
        }
      }
    }
    return params;
  }

  get<T>(path: string, params?: Record<string, unknown>): Observable<T> {
    const httpParams = params ? this.toParams(params) : undefined;
    return this.http.get<OperationResult<T>>(this.url(path), { params: httpParams }).pipe(
      timeout(REQUEST_TIMEOUT_MS),
      map(res => this.unwrap(res)),
      catchError(err => this.handleError(err))
    );
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<OperationResult<T>>(this.url(path), body).pipe(
      timeout(REQUEST_TIMEOUT_MS),
      map(res => this.unwrap(res)),
      catchError(err => this.handleError(err))
    );
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<OperationResult<T>>(this.url(path), body).pipe(
      timeout(REQUEST_TIMEOUT_MS),
      map(res => this.unwrap(res)),
      catchError(err => this.handleError(err))
    );
  }

  delete<T = void>(path: string): Observable<T> {
    return this.http.delete<OperationResult<T>>(this.url(path)).pipe(
      timeout(REQUEST_TIMEOUT_MS),
      map(res => this.unwrap(res)),
      catchError(err => this.handleError(err))
    );
  }

  private unwrap<T>(response: OperationResult<T>): T {
    if (!response.success) {
      throw new Error(response.message || 'Error del servidor');
    }
    return response.data as T;
  }

  private handleError(error: unknown): Observable<never> {
    let message: string;

    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;

      // Timeout
      if (err['name'] === 'TimeoutError') {
        message = 'El servidor no responde. Verifica que el backend esté corriendo.';
      }
      // HTTP error
      else if ('status' in err) {
        const status = err['status'] as number;
        const body = err['error'] as { message?: string } | undefined;
        switch (status) {
          case 0: message = 'No hay conexión con el servidor. ¿Está corriendo el backend?'; break;
          case 401: message = 'Credenciales inválidas o sesión expirada.'; break;
          case 403: message = 'No tienes permisos para esta acción.'; break;
          case 404: message = 'Recurso no encontrado.'; break;
          case 500: message = body?.message || 'Error interno del servidor.'; break;
          default: message = `Error del servidor [${status}]: ${body?.message || 'Error desconocido'}`;
        }
      }
      // Error lanzado por unwrap()
      else if (err['message']) {
        message = err['message'] as string;
      } else {
        message = 'Error de conexión al servidor.';
      }
    } else {
      message = 'Error inesperado. Intenta de nuevo.';
    }

    console.error(`[ApiClient] ${message}`, error);
    return throwError(() => new Error(message));
  }
}
