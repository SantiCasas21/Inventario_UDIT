import { inject } from '@angular/core';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmacionService } from '@app/core/services/confirmacion.service';

@Component({
  selector: 'app-popup-ubicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './popup-ubicaciones.component.html',
  styleUrl: './popup-ubicaciones.component.scss'
})
export class PopupUbicacionesComponent implements OnInit {
  confirmacionService = inject(ConfirmacionService);
  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ref: MatDialogRef<PopupUbicacionesComponent>,
    private formBuilder: FormBuilder,
    private service: CatalogoService
  ) {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data?.data) {
      this.form.patchValue(this.data.data);
      // Patch nombre field from legacy field name if present
      if (!this.data.data.nombre && this.data.data.ubicacion) {
        this.form.patchValue({ nombre: this.data.data.ubicacion });
      }
    }
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarUbicaciones(){
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const nombre = this.form.value.nombre;
    this.confirmacionService.confirmarGuardado('Ubicación', false, nombre).subscribe(confirmado => {
      if (confirmado) {
        const endpoint = this.data.endpoint || 'ubicacion';
        this.service.create(endpoint, { nombre: this.form.value.nombre }).subscribe({
          next: () => {
            this.cerrarPopup();
          },
          error: (err: any) => {
            const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'Ocurrió un error al guardar el registro.');
            this.confirmacionService.mostrarAdvertencia('Error de validación', msg);
          }
        });
      }
    });
  }

  actualizarUbicaciones(){
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const nombre = this.form.value.nombre;
    this.confirmacionService.confirmarGuardado('Ubicación', true, nombre).subscribe(confirmado => {
      if (confirmado) {
        const endpoint = this.data.endpoint || 'ubicacion';
        this.service.update(endpoint, this.data.data.id, { nombre: this.form.value.nombre }).subscribe({
          next: () => {
            this.cerrarPopup();
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
