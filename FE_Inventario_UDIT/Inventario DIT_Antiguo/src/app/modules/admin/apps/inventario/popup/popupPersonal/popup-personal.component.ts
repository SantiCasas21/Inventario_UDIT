import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-personal',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatDialogModule],
  templateUrl: './popup-personal.component.html',
  styleUrl: './popup-personal.component.scss'
})
export class PopupPersonalComponent {
  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupPersonalComponent>, private formBuilder:FormBuilder, private service:CatalogoService) {
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

  guardarPersonal(){
    const endpoint = this.data.endpoint || 'personal';
    this.service.create(endpoint, { nombre: this.form.value.nombre }).subscribe({
      next:() => {
        this.cerrarPopup();
      }
    });
  }

  actualizarPersonal(){
    const endpoint = this.data.endpoint || 'personal';
    const id: number = this.data.data.id;
    this.service.update(endpoint, id, { nombre: this.form.value.nombre }).subscribe({
      next:() => {
        this.cerrarPopup();
      }
    });
  }
}
