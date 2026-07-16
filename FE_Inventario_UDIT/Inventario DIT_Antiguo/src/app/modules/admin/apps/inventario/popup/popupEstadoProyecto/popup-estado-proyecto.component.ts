import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EstadoproyectoService } from '../../../../../../../@fuse/services/inventario/estadoproyecto/estadoproyecto.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-estado-proyecto',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './popup-estado-proyecto.component.html',
  styleUrl: './popup-estado-proyecto.component.scss'
})
export class PopupEstadoProyectoComponent {
  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupEstadoProyectoComponent>, private formBuilder:FormBuilder, private service:EstadoproyectoService) {
    this.form = this.formBuilder.group({
      estado: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarEstadoProyecto(){
    this.service.guardarEstadoProyecto(this.form.value).subscribe({
      next:(res : any )=>{
        this.cerrarPopup();
        alert(res.mensaje)
      }})
  }

  actualizarEstadoProyecto(){
    const edit : any ={
      id : this.data.data.id,
      estado :  this.form.value.estado
    }
    var id = edit.id
    this.service.actualizarEstadoProyecto(id, edit).subscribe({
      next:(res=>{
        alert(res.mensaje)
        this.cerrarPopup();
      })
    })
  }
}
