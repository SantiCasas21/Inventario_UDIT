import { inject } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-popup-tipo-compra',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatDialogModule],
  templateUrl: './popup-tipo-compra.component.html',
  styleUrl: './popup-tipo-compra.component.scss'
})
export class PopupTipoCompraComponent {
  fuseConfirmation = inject(FuseConfirmationService);

  inputData:any;
  form:FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupTipoCompraComponent>, private formBuilder:FormBuilder, private service:CatalogoService) {
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
    const endpoint = this.data.endpoint || 'tipo-compra';
    this.service.create(endpoint, { nombre: this.form.value.nombre }).subscribe({
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

  actualizarTipoCompra(){
    const endpoint = this.data.endpoint || 'tipo-compra';
    const id: number = this.data.data.id;
    this.service.update(endpoint, id, { nombre: this.form.value.nombre }).subscribe({
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
