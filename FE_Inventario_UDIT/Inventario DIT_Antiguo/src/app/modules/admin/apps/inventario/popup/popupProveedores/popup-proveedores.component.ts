import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProveedoresService } from '../../../../../../../@fuse/services/inventario/proveedores/proveedores.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-proveedores',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './popup-proveedores.component.html',
  styleUrl: './popup-proveedores.component.scss'
})
export class PopupProveedoresComponent {
  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupProveedoresComponent>, private formBuilder:FormBuilder, private service:ProveedoresService) {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required],
      contacto: ['', Validators.required],
      direccion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarProveedores(){
    this.service.guardarProveedores(this.form.value).subscribe({
      next:(res : any )=>{
        this.cerrarPopup();
        alert(res.mensaje)
      }})
  }

  actualizarProveedores(){
    const edit : any ={
      id : this.data.data.id,
      nombre :  this.form.value.nombre,
      contacto :  this.form.value.contacto,
      direccion :  this.form.value.direccion
    }
    var id = edit.id
    this.service.actualizarProveedores(id, edit).subscribe({
      next:(res=>{
        alert(res.mensaje)
        this.cerrarPopup();
      })
    })
  }
}
