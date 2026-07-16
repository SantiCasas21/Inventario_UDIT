import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NombreInsumo } from '../../../../interfaces/nombreinsumo';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NombreinsumoService {

  constructor(private http:HttpClient) { }

  listarNombreInsumo(): Promise<NombreInsumo[]>{
    return new Promise<NombreInsumo[]>((resolve, reject) => {
      this.http.get<NombreInsumo[]>(`${environment.HOST}${environment.GESTIONNOMBREINSUMOLISTAR_AGREGAR}`).subscribe({
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

  guardarNombreInsumo(data:any){
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONNOMBREINSUMOLISTAR_AGREGAR}`, data);
  }

  actualizarNombreInsumo(id:number, data:any){
    return this.http.post<any>(`${environment.HOST}NombreInsumo/ActualizarNombreInsumo?id=${id}`, data);
  }
}
