import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IngresoInsumo } from '../../../../interfaces/ingresoinsumo';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IngresoinsumoService {

  constructor(private http:HttpClient) { }

  listarIngresoInsumo(): Promise<IngresoInsumo[]>{
    return new Promise<IngresoInsumo[]>((resolve, reject) => {
      this.http.get<IngresoInsumo[]>(`${environment.HOST}${environment.GESTIONINGRESOINSUMOLISTAR_AGREGAR}`).subscribe({
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

  guardarIngresoInsumo(data:any){
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONINGRESOINSUMOLISTAR_AGREGAR}`, data);
  }

  actualizarIngresoInsumo(id:number, data:any){
    return this.http.post<any>(`${environment.HOST}IngresoInsumo/ActualizarIngresoInsumo?id=${id}`, data);
  }
}
