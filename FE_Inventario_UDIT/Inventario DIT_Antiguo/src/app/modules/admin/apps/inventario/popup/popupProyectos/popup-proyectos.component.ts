import { inject } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ProyectoService } from '@app/core/services/proyecto.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { CatalogoDto } from '@app/core/models';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-popup-proyectos',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatDialogModule],
  templateUrl: './popup-proyectos.component.html',
  styleUrl: './popup-proyectos.component.scss'
})
export class PopupProyectosComponent implements OnInit {
  fuseConfirmation = inject(FuseConfirmationService);

  inputData:any;
  form:FormGroup;
  estados: CatalogoDto[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data:any,
    private ref:MatDialogRef<PopupProyectosComponent>,
    private formBuilder:FormBuilder,
    private proyectoService:ProyectoService,
    private catalogoService:CatalogoService
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
    const data = {
      nombre: this.form.value.nombre,
      descripcion: this.form.value.descripcion,
      idEstado: this.form.value.idEstado
    };
    this.proyectoService.create(data).subscribe({
      next:() => {
        this.cerrarPopup();
      },
      error: (err:any) => {
        const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'Ocurri\u00f3 un error al guardar el registro.');
        this.fuseConfirmation.open({
          title: 'Error de validaci\u00f3n',
          message: msg,
          icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
          actions: { confirm: { show: true, label: 'Entendido', color: 'primary' }, cancel: { show: false, label: 'Cancelar' } }
        });
      }
    });
  }

  actualizarProyectos(){
    const id: number = this.data.data.id;
    const data = {
      nombre: this.form.value.nombre,
      descripcion: this.form.value.descripcion,
      idEstado: this.form.value.idEstado
    };
    this.proyectoService.update(id, data).subscribe({
      next:() => {
        this.cerrarPopup();
      },
      error: (err:any) => {
        const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'Ocurri\u00f3 un error al guardar el registro.');
        this.fuseConfirmation.open({
          title: 'Error de validaci\u00f3n',
          message: msg,
          icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
          actions: { confirm: { show: true, label: 'Entendido', color: 'primary' }, cancel: { show: false, label: 'Cancelar' } }
        });
      }
    });
  }
}
