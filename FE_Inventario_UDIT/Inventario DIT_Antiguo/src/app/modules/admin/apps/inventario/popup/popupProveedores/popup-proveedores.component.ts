import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ProveedorFullService } from '@app/core/services/proveedor-full.service';
import { ProveedorFullRequest } from '@app/core/models';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-proveedores',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatDialogModule],
  templateUrl: './popup-proveedores.component.html',
  styleUrl: './popup-proveedores.component.scss'
})
export class PopupProveedoresComponent {
  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupProveedoresComponent>, private formBuilder:FormBuilder, private service:ProveedorFullService) {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required],
      contacto: [''],
      direccion: ['']
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarProveedores(){
    const data: ProveedorFullRequest = {
      nombre: this.form.value.nombre,
      contacto: this.form.value.contacto,
      direccion: this.form.value.direccion
    };
    this.service.create(data).subscribe({
      next:() => {
        this.cerrarPopup();
      }
    });
  }

  actualizarProveedores(){
    const id: number = this.data.data.id;
    const data: ProveedorFullRequest = {
      nombre: this.form.value.nombre,
      contacto: this.form.value.contacto,
      direccion: this.form.value.direccion
    };
    this.service.update(id, data).subscribe({
      next:() => {
        this.cerrarPopup();
      }
    });
  }
}
