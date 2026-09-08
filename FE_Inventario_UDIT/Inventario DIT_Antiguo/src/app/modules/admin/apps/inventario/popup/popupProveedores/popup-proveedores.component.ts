import { inject } from '@angular/core';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ProveedorFullService } from '@app/core/services/proveedor-full.service';
import { ProveedorFullRequest } from '@app/core/models';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmacionService } from '@app/core/services/confirmacion.service';

@Component({
  selector: 'app-popup-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './popup-proveedores.component.html',
  styleUrl: './popup-proveedores.component.scss'
})
export class PopupProveedoresComponent implements OnInit {
  confirmacionService = inject(ConfirmacionService);
  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ref: MatDialogRef<PopupProveedoresComponent>,
    private formBuilder: FormBuilder,
    private service: ProveedorFullService
  ) {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required],
      contacto: [''],
      direccion: ['']
    });
  }

  ngOnInit(): void {
    if (this.data?.data) {
      this.form.patchValue(this.data.data);
    }
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarProveedores(){
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const nombre = this.form.value.nombre;
    this.confirmacionService.confirmarGuardado('Proveedor', false, nombre).subscribe(confirmado => {
      if (confirmado) {
        const data: ProveedorFullRequest = {
          nombre: this.form.value.nombre,
          contacto: this.form.value.contacto,
          direccion: this.form.value.direccion
        };
        this.service.create(data).subscribe({
          next: () => {
            this.ref.close(true);
          },
          error: (err: any) => {
            const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'Ocurrió un error al guardar el registro.');
            this.confirmacionService.mostrarAdvertencia('Error de validación', msg);
          }
        });
      }
    });
  }

  actualizarProveedores(){
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const nombre = this.form.value.nombre;
    this.confirmacionService.confirmarGuardado('Proveedor', true, nombre).subscribe(confirmado => {
      if (confirmado) {
        const data: ProveedorFullRequest = {
          nombre: this.form.value.nombre,
          contacto: this.form.value.contacto,
          direccion: this.form.value.direccion
        };
        this.service.update(this.data.data.id, data).subscribe({
          next: () => {
            this.ref.close(true);
          },
          error: (err: any) => {
            const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'Ocurrió un error al actualizar el registro.');
            this.confirmacionService.mostrarAdvertencia('Error de validación', msg);
          }
        });
      }
    });
  }
}
