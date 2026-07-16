import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Proveedores } from '../../../../interfaces/proveedores';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  constructor(private http:HttpClient) { }

  listarProveedores(): Promise<Proveedores[]>{
    return new Promise<Proveedores[]>((resolve, reject) => {
      this.http.get<Proveedores[]>(`${environment.HOST}${environment.GESTIONPROVEEDORESLISTAR_AGREGAR}`).subscribe({
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

  guardarProveedores(data:any){
    return this.http.post<any>(`${environment.HOST}${environment.GESTIONPROVEEDORESLISTAR_AGREGAR}`, data);
  }

  actualizarProveedores(id:number, data:any){
    return this.http.post<any>(`${environment.HOST}Proveedores/ActualizarProveedor?id=${id}`, data);
  }
}
