import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EmpaquetamientoService } from '../../../../../../../@fuse/services/inventario/empaquetamiento/empaquetamiento.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-empaquetamiento',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './popup-empaquetamiento.component.html',
  styleUrl: './popup-empaquetamiento.component.scss'
})
export class PopupEmpaquetamientoComponent {
  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupEmpaquetamientoComponent>, private formBuilder:FormBuilder, private service:EmpaquetamientoService) {
      this.form = this.formBuilder.group({
        tipo: ['', Validators.required],
      });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarEmpaquetamiento(){
    this.service.guardarEmpaquetamiento(this.form.value).subscribe({
      next:(res : any )=>{
        this.cerrarPopup();
        alert(res.mensaje)
      }})
  }

  actualizarEmpaquetamiento(){
    const edit : any ={
      id : this.data.data.id,
      tipo :  this.form.value.tipo
    }
    var id = edit.id
    this.service.actualizarEmpaquetamiento(id, edit).subscribe({
      next:(res=>{
        alert(res.mensaje)
        this.cerrarPopup();
      })
    })
  }
}
