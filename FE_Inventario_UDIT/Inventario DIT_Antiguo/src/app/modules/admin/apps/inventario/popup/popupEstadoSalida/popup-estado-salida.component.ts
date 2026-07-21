import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-estado-salida',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatDialogModule],
  templateUrl: './popup-estado-salida.component.html',
  styleUrl: './popup-estado-salida.component.scss'
})
export class PopupEstadoSalidaComponent {
  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupEstadoSalidaComponent>, private formBuilder:FormBuilder, private service:CatalogoService) {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarEstadoSalida(){
    const endpoint = this.data.endpoint || 'estado-salida';
    this.service.create(endpoint, { nombre: this.form.value.nombre }).subscribe({
      next:() => {
        this.cerrarPopup();
      }
    });
  }

  actualizarEstadoSalida(){
    const endpoint = this.data.endpoint || 'estado-salida';
    const id: number = this.data.data.id;
    this.service.update(endpoint, id, { nombre: this.form.value.nombre }).subscribe({
      next:() => {
        this.cerrarPopup();
      }
    });
  }
}
