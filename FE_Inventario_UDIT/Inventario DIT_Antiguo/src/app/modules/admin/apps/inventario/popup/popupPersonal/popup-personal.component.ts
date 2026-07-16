import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PersonalService } from '../../../../../../../@fuse/services/inventario/personal/personal.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-personal',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './popup-personal.component.html',
  styleUrl: './popup-personal.component.scss'
})
export class PopupPersonalComponent {
  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupPersonalComponent>, private formBuilder:FormBuilder, private service:PersonalService) {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required],
      cargo: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarPersonal(){
    this.service.guardarPersonal(this.form.value).subscribe({
      next:(res : any )=>{
        this.cerrarPopup();
        alert(res.mensaje)
      }})
  }

  actualizarPersonal(){
    const edit : any ={
      id : this.data.data.id,
      nombre :  this.form.value.nombre,
      cargo :  this.form.value.cargo,
    }
    var id = edit.id
    this.service.actualizarPersonal(id, edit).subscribe({
      next:(res=>{
        alert(res.mensaje)
        this.cerrarPopup();
      })
    })
  }
}
