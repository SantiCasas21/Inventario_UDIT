import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EstadoSalida } from '../../../../interfaces/estadosalida';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EstadosalidaService {

  constructor(private http:HttpClient) { }

  listarEstadoSalida(): Promise<EstadoSalida[]>{
    return new Promise<EstadoSalida[]>((resolve, reject) => {
      this.http.get<EstadoSalida[]>(`${environment.HOST}${environment.GESTIONESTADOSALIDALISTAR_AGREGAR}`).subscribe({
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

  guardarEstadoSalida(data:any){
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONESTADOSALIDALISTAR_AGREGAR}`, data);
  }

  actualizarEstadoSalida(id:number, data:any){
    return this.http.post<any>(`${environment.HOST}EstadoSalida/ActualizarEstadoSalida?id=${id}`, data);
  }
}
