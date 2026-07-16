import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NombreinsumoService } from '../../../../../../../@fuse/services/inventario/nombreinsumo/nombreinsumo.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-nombre-insumo',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './popup-nombre-insumo.component.html',
  styleUrl: './popup-nombre-insumo.component.scss'
})
export class PopupNombreInsumoComponent {
  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupNombreInsumoComponent>, private formBuilder:FormBuilder, private service:NombreinsumoService) {
    this.form = this.formBuilder.group({
      nombreInsumo: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarNombreInsumo(){
    this.service.guardarNombreInsumo(this.form.value).subscribe({
      next:(res : any )=>{
        this.cerrarPopup();
        alert(res.mensaje)
      }})
  }

  actualizarNombreInsumo(){
    const edit : any ={
      id : this.data.data.id,
      nombreInsumo :  this.form.value.nombreInsumo
    }
    var id = edit.id
    this.service.actualizarNombreInsumo(id, edit).subscribe({
      next:(res=>{
        alert(res.mensaje)
        this.cerrarPopup();
      })
    })
  }
}
