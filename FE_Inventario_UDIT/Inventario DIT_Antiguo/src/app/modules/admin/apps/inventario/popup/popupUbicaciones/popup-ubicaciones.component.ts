import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UbicacionesService } from '../../../../../../../@fuse/services/inventario/ubicaciones/ubicaciones.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-ubicaciones',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './popup-ubicaciones.component.html',
  styleUrl: './popup-ubicaciones.component.scss'
})
export class PopupUbicacionesComponent {
  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupUbicacionesComponent>, private formBuilder:FormBuilder, private service:UbicacionesService) {
    this.form = this.formBuilder.group({
      ubicacion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarUbicaciones(){
    this.service.guardarUbicaciones(this.form.value).subscribe({
      next:(res : any )=>{
        this.cerrarPopup();
        alert(res.mensaje)
      }})
  }

  actualizarUbicaciones(){
    const edit : any ={
      id : this.data.data.id,
      ubicacion :  this.form.value.ubicacion
    }
    var id = edit.id
    this.service.actualizarUbicaciones(id, edit).subscribe({
      next:(res=>{
        alert(res.mensaje)
        this.cerrarPopup();
      })
    })
  }
}
