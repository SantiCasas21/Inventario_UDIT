import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Empaquetamiento } from '../../../../interfaces/empaquetamiento';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpaquetamientoService {

  constructor(private http:HttpClient) { }

  listarEmpaquetamiento(): Promise<Empaquetamiento[]>{
    return new Promise<Empaquetamiento[]>((resolve, reject) => {
      this.http.get<Empaquetamiento[]>(`${environment.HOST}${environment.GESTIONEMPAQUETAMIENTOLISTAR_AGREGAR}`).subscribe({
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

  guardarEmpaquetamiento(tipo:any){
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONEMPAQUETAMIENTOLISTAR_AGREGAR}`, tipo);
  }

  actualizarEmpaquetamiento(id:number, data:any){
    return this.http.post<any>(`${environment.HOST}Empaquetamiento/ActualizarEmpaquetamiento?id=${id}`, data);
  }
}
