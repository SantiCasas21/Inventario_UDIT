import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ubicaciones } from '../../../../interfaces/ubicaciones';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UbicacionesService {

  constructor(private http:HttpClient) { }

  listarUbicaciones(): Promise<Ubicaciones[]>{
    return new Promise<Ubicaciones[]>((resolve, reject) => {
      this.http.get<Ubicaciones[]>(`${environment.HOST}${environment.GESTIONUBICACIONESLISTAR_AGREGAR}`).subscribe({
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

  guardarUbicaciones(data:any){
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONUBICACIONESLISTAR_AGREGAR}`, data);
  }

  actualizarUbicaciones(id:number, data:any){
    return this.http.post<any>(`${environment.HOST}Ubicaciones/ActualizarUbicaciones?id=${id}`, data);
  }
}
