import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Personal } from '../../../../interfaces/personal';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PersonalService {

  constructor(private http:HttpClient) { }

  listarPersonal(): Promise<Personal[]>{
    return new Promise<Personal[]>((resolve, reject) => {
      this.http.get<Personal[]>(`${environment.HOST}${environment.GESTIONPERSONALLISTAR_AGREGAR}`).subscribe({
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

  guardarPersonal(data:any){
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONPERSONALLISTAR_AGREGAR}`, data);
  }

  actualizarPersonal(id:number, data:any){
    return this.http.post<any>(`${environment.HOST}Personal/ActualizarPersonal?id=${id}`, data);
  }
}
