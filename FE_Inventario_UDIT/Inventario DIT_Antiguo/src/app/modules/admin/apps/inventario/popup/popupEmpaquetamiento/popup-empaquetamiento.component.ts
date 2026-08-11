import { inject } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { CatalogoDto, CatalogoRequestDto, EmpaquetamientoDto } from '@app/core/models';
import { MatButtonModule } from '@angular/material/button';
import { clasificarEmpaquetamiento } from '@shared/helpers/empaquetamiento-clasificador';

@Component({
  selector: 'app-popup-empaquetamiento',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, MatButtonModule, MatDialogModule],
  templateUrl: './popup-empaquetamiento.component.html',
  styleUrl: './popup-empaquetamiento.component.scss'
})
export class PopupEmpaquetamientoComponent {
  fuseConfirmation = inject(FuseConfirmationService);

  inputData:any;
  form:FormGroup;
  familias: CatalogoDto[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) public data:any, private ref:MatDialogRef<PopupEmpaquetamientoComponent>, private formBuilder:FormBuilder, private service:CatalogoService) {
      this.form = this.formBuilder.group({
        nombre: ['', Validators.required],
        idFamiliaEmpaquetamiento: [null],
      });
  }

  ngOnInit(): void {
    // Cargar las familias de empaquetamiento
    this.service.getAll('familia-empaquetamiento').subscribe(familias => {
      this.familias = familias;
      this.patchDatos();
    });
  }

  private patchDatos(): void {
    if (!this.data?.data) return;

    const raw = this.data.data as EmpaquetamientoDto;
    this.form.patchValue({ nombre: raw.nombre || raw.tipo || '' });
    if (raw.idFamiliaEmpaquetamiento) {
      this.form.patchValue({ idFamiliaEmpaquetamiento: raw.idFamiliaEmpaquetamiento });
    }
  }

  /** Auto-sugerencia: al escribir el nombre, se clasifica la familia automáticamente. */
  onNombreInput(): void {
    const nombre = this.form.get('nombre')?.value;
    const familiaNombre = clasificarEmpaquetamiento(nombre);
    const match = this.familias.find(f => f.nombre === familiaNombre);
    if (match) {
      this.form.get('idFamiliaEmpaquetamiento')?.setValue(match.id);
    }
  }

  cerrarPopup() {
    this.ref.close();
  }

  private onError(err:any): void {
    const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'Ocurrió un error al guardar el registro.');
    this.fuseConfirmation.open({
      title: 'Error de validación',
      message: msg,
      icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
      actions: { confirm: { show: true, label: 'Entendido', color: 'primary' }, cancel: { show: false, label: 'Cancelar' } }
    });
  }

  guardarEmpaquetamiento(){
    const endpoint = this.data.endpoint || 'empaquetamiento';
    const payload = {
      nombre: this.form.value.nombre,
      idFamiliaEmpaquetamiento: this.form.value.idFamiliaEmpaquetamiento ?? null
    } as CatalogoRequestDto;
    this.service.create(endpoint, payload).subscribe({
      next:() => { this.cerrarPopup(); },
      error: (err:any) => this.onError(err)
    });
  }

  actualizarEmpaquetamiento(){
    const endpoint = this.data.endpoint || 'empaquetamiento';
    const id: number = this.data.data.id;
    const payload = {
      nombre: this.form.value.nombre,
      idFamiliaEmpaquetamiento: this.form.value.idFamiliaEmpaquetamiento ?? null
    } as CatalogoRequestDto;
    this.service.update(endpoint, id, payload).subscribe({
      next:() => { this.cerrarPopup(); },
      error: (err:any) => this.onError(err)
    });
  }
}
