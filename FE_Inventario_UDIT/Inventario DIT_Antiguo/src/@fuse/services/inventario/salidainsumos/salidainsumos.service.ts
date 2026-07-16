import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SalidaInsumos } from '../../../../interfaces/salidainsumos';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SalidainsumosService {

  constructor(private http:HttpClient) { }

  listarSalidaInsumos(): Promise<SalidaInsumos[]>{
    return new Promise<SalidaInsumos[]>((resolve, reject) => {
      this.http.get<SalidaInsumos[]>(`${environment.HOST}${environment.GESTIONSALIDAINSUMOSLISTAR_AGREGAR}`).subscribe({
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

  guardarSalidaInsumos(data:any){
   
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONSALIDAINSUMOSLISTAR_AGREGAR}`, data);
  }

  actualizarSalidaInsumos(id:number, data:any){
    
    return this.http.post<any>(`${environment.HOST}SalidaInsumos/ActualizarSalidaInsumo?id=${id}`, data);
  }
}
