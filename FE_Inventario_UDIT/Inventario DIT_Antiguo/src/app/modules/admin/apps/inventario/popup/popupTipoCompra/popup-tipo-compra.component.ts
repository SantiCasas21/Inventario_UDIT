import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TipocompraService } from '../../../../../../../@fuse/services/inventario/tipocompra/tipocompra.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-tipo-compra',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './popup-tipo-compra.component.html',
  styleUrl: './popup-tipo-compra.component.scss'
})
export class PopupTipoCompraComponent {
  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupTipoCompraComponent>, private formBuilder:FormBuilder, private service:TipocompraService) {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
  }

  cerrarPopup() {
    this.ref.close();
  }


  guardarTipoCompra() {
    this.service.guardarTipoCompra(this.form.value).subscribe(
      (res) => {
        this.cerrarPopup();
        alert(res.mensaje)
      }
    );
  }

  actualizarTipoCompra(){
    const edit : any ={
      id : this.data.data.id,
      nombre :  this.form.value.nombre
    }
    var id = edit.id
    this.service.actualizarTipoCompra(id, edit).subscribe({
      next:(res=>{
        alert(res.mensaje)
        this.cerrarPopup();
      })
    })
  }
}
