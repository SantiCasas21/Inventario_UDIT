import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TipoCompra } from '../../../../interfaces/tipocompra';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TipocompraService {

  constructor(private http:HttpClient) { }

  listarTipoCompra(): Promise<TipoCompra[]>{
    return new Promise<TipoCompra[]>((resolve, reject) => {
      this.http.get<TipoCompra[]>(`${environment.HOST}${environment.GESTIONTIPOCOMPRALISTAR_AGREGAR}`).subscribe({
        next: (response: any) => {
          if(response) {
            resolve(response);
          } else {
            resolve([]);
          }
        },
        error: (err) => reject(err)
      })
    });
  }

  guardarTipoCompra(data:any):Observable<any>{
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONTIPOCOMPRALISTAR_AGREGAR}`, data);
  }

  actualizarTipoCompra(id:number, data:any){
    return this.http.post<any>(`${environment.HOST}TipoCompra/ActualizarTipoCompra?id=${id}`, data);
  }
}
