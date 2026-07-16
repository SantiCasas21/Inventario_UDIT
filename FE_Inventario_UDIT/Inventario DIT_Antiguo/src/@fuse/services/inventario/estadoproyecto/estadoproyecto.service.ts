import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EstadoProyecto } from '../../../../interfaces/estadoproyecto';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EstadoproyectoService {

  constructor(private http:HttpClient) { }

  listarEstadoProyecto(): Promise<EstadoProyecto[]>{
    return new Promise<EstadoProyecto[]>((resolve, reject) => {
      this.http.get<EstadoProyecto[]>(`${environment.HOST}${environment.GESTIONESTADOPROYECTOLISTAR_AGREGAR}`).subscribe({
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

  guardarEstadoProyecto(data:any){
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONESTADOPROYECTOLISTAR_AGREGAR}`, data);
  }

  actualizarEstadoProyecto(id:number, data:any){
    return this.http.post<any>(`${environment.HOST}EstadoProyecto/ActualizarEstadoProyecto?id=${id}`, data);
  }
}
