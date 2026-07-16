import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Insumos } from '../../../../interfaces/insumos';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InsumosService {

  constructor(private http:HttpClient) { }

  listarInsumos(): Promise<Insumos[]>{
    return new Promise<Insumos[]>((resolve, reject) => {
      this.http.get<Insumos[]>(`${environment.HOST}${environment.GESTIONINSUMOSLISTAR_AGREGAR}`).subscribe({
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

  guardarInsumos(data:any){
    debugger;
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONINSUMOSLISTAR_AGREGAR}`, data);
  }

  actualizarInsumos(id:number, data:any){
    return this.http.post<any>(`${environment.HOST}Insumos/ActualizarInsumo?id=${id}`, data);
  }
}
