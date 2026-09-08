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
  selector: 'app-popup-personal',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './popup-personal.component.html',
  styleUrl: './popup-personal.component.scss'
})
export class PopupPersonalComponent implements OnInit {
  confirmacionService = inject(ConfirmacionService);
  form: FormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ref: MatDialogRef<PopupPersonalComponent>,
    private formBuilder: FormBuilder,
    private service: CatalogoService
  ) {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required],
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

  guardarPersonal(){
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const nombre = this.form.value.nombre;
    this.confirmacionService.confirmarGuardado('Personal', false, nombre).subscribe(confirmado => {
      if (confirmado) {
        const endpoint = this.data.endpoint || 'personal';
        this.service.create(endpoint, { nombre: this.form.value.nombre }).subscribe({
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

  actualizarPersonal(){
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const nombre = this.form.value.nombre;
    this.confirmacionService.confirmarGuardado('Personal', true, nombre).subscribe(confirmado => {
      if (confirmado) {
        const endpoint = this.data.endpoint || 'personal';
        const id: number = this.data.data.id;
        this.service.update(endpoint, id, { nombre: this.form.value.nombre }).subscribe({
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
