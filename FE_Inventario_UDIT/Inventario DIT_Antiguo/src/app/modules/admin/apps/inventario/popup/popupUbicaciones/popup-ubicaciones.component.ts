import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-ubicaciones',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatDialogModule],
  templateUrl: './popup-ubicaciones.component.html',
  styleUrl: './popup-ubicaciones.component.scss'
})
export class PopupUbicacionesComponent {
  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupUbicacionesComponent>, private formBuilder:FormBuilder, private service:CatalogoService) {
    this.form = this.formBuilder.group({
      nombre: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
    // Patch nombre field from legacy field name if present
    if (this.data.data && !this.data.data.nombre && this.data.data.ubicacion) {
      this.form.patchValue({ nombre: this.data.data.ubicacion });
    }
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarUbicaciones(){
    const endpoint = this.data.endpoint || 'ubicacion';
    this.service.create(endpoint, { nombre: this.form.value.nombre }).subscribe({
      next:() => {
        this.cerrarPopup();
      }
    });
  }

  actualizarUbicaciones(){
    const endpoint = this.data.endpoint || 'ubicacion';
    const id: number = this.data.data.id;
    this.service.update(endpoint, id, { nombre: this.form.value.nombre }).subscribe({
      next:() => {
        this.cerrarPopup();
      }
    });
  }
}
