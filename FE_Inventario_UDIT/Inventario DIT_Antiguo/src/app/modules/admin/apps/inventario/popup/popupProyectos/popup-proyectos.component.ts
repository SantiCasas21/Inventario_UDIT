import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ProyectosService } from '../../../../../../../@fuse/services/inventario/proyectos/proyectos.service';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';

@Component({
  selector: 'app-popup-proyectos',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatSelectModule, MatDatepickerModule],
  templateUrl: './popup-proyectos.component.html',
  styleUrl: './popup-proyectos.component.scss'
})
export class PopupProyectosComponent {
  inputData:any;
  form:FormGroup;
  datoscompletos:any;
  listadoestados:any;
  estados: any;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupProyectosComponent>, private formBuilder:FormBuilder, private service:ProyectosService) {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      idEstado: ['', Validators.required],
      nombreEstado: ['', Validators.required],
      fechaCreacion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
    this.listarEstados();
  }

  async listarEstados(){

    this.datoscompletos = await this.service.listarProyectos();
    this.listadoestados = this.datoscompletos.estadoProyectos;
    this.estados = this.listadoestados;
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarProyectos(){
    this.service.guardarProyectos(this.form.value).subscribe({
      next:(res : any )=>{
        this.cerrarPopup();
        alert(res.mensaje)
      }})
    }

    actualizarProyectos(){
      const edit : any ={
        id : this.data.data.id,
        nombre :  this.form.value.nombre,
        descripcion :  this.form.value.descripcion,
        idEstado :  this.form.value.idEstado,
        nombreEstado :  this.form.value.nombreEstado,
        fechaCreacion :  this.form.value.fechaCreacion
      }
      var id = edit.id
      this.service.actualizarProyectos(id, edit).subscribe({
        next:(res=>{
          alert(res.mensaje)
          this.cerrarPopup();
        })
      })
    }
}
