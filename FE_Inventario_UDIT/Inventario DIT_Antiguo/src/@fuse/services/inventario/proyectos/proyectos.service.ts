import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Proyectos } from '../../../../interfaces/proyectos';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProyectosService {

  constructor(private http:HttpClient) { }

  listarProyectos(): Promise<Proyectos[]>{
    return new Promise<Proyectos[]>((resolve, reject) => {
      this.http.get<Proyectos[]>(`${environment.HOST}${environment.GESTIONPROYECTOSLISTAR}`).subscribe({
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

  guardarProyectos(data:any){
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONPROYECTOSAGREGAR}`, data);
  }

  actualizarProyectos(id:number, data:any){
    return this.http.post<any>(`${environment.HOST}Proyectos/ActualizarProyecto?id=${id}`, data);
  }
}
