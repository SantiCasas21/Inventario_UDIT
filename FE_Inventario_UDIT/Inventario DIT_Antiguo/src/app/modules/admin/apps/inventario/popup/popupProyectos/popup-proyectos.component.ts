import { inject } from '@angular/core';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ProyectoService } from '@app/core/services/proyecto.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { CatalogoDto } from '@app/core/models';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ConfirmacionService } from '@app/core/services/confirmacion.service';

@Component({
  selector: 'app-popup-proyectos',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatIconModule, MatDialogModule],
  templateUrl: './popup-proyectos.component.html',
  styleUrl: './popup-proyectos.component.scss'
})
export class PopupProyectosComponent implements OnInit {
  confirmacionService = inject(ConfirmacionService);
  form: FormGroup;
  estados: CatalogoDto[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private ref: MatDialogRef<PopupProyectosComponent>,
    private formBuilder: FormBuilder,
    private proyectoService: ProyectoService,
    private catalogoService: CatalogoService
  ) {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      idEstado: ['', Validators.required],
      fechaCreacion: ['']
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
    if (this.data.data && this.data.data.fechaCreacion) {
      this.form.patchValue({ fechaCreacion: new Date(this.data.data.fechaCreacion) });
    }
    this.listarEstados();
  }

  listarEstados(){
    this.catalogoService.getAll('estado-proyecto').subscribe(data => {
      this.estados = data;
    });
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarProyectos(){
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const nombre = this.form.value.nombre;
    this.confirmacionService.confirmarGuardado('Proyecto', false, nombre).subscribe(confirmado => {
      if (confirmado) {
        const data = {
          nombre: this.form.value.nombre,
          descripcion: this.form.value.descripcion,
          idEstado: this.form.value.idEstado
        };
        this.proyectoService.create(data).subscribe({
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

  actualizarProyectos(){
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const nombre = this.form.value.nombre;
    this.confirmacionService.confirmarGuardado('Proyecto', true, nombre).subscribe(confirmado => {
      if (confirmado) {
        const data = {
          nombre: this.form.value.nombre,
          descripcion: this.form.value.descripcion,
          idEstado: this.form.value.idEstado
        };
        this.proyectoService.update(this.data.data.id, data).subscribe({
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
