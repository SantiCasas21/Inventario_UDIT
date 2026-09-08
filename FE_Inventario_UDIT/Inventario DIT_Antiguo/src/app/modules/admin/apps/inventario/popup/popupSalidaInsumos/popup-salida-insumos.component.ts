import { inject } from '@angular/core';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MovimientoService } from '@app/core/services/movimiento.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { CatalogoDto } from '@app/core/models';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ConfirmacionService } from '@app/core/services/confirmacion.service';

@Component({
  selector: 'app-popup-salida-insumos',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatDialogModule],
  templateUrl: './popup-salida-insumos.component.html',
  styleUrl: './popup-salida-insumos.component.scss'
})
export class PopupSalidaInsumosComponent implements OnInit {
  confirmacionService = inject(ConfirmacionService);

  inputData:any;
  form:FormGroup;
  proyectos: CatalogoDto[] = [];
  estadosalidas: CatalogoDto[] = [];
  insumos: CatalogoDto[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data:any,
    private ref:MatDialogRef<PopupSalidaInsumosComponent>,
    private formBuilder:FormBuilder,
    private movimientoService: MovimientoService,
    private catalogoService: CatalogoService
  ) {
    this.form = this.formBuilder.group({
      idInsumo: ['', Validators.required],
      cantidad: ['', Validators.required],
      idProyecto: [''],
      idEstadoSalida: [''],
      observacion: [''],
      fecha: ['']
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
    this.catalogoService.getAll('proyecto').subscribe(data => this.proyectos = data);
    this.catalogoService.getAll('estado-salida').subscribe(data => this.estadosalidas = data);
    this.catalogoService.getAll('categoria-insumo').subscribe(data => this.insumos = data);
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarSalidaInsumos(){
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmacionService.confirmar({
      titulo: 'Confirmar Salida de Insumo',
      mensajePrincipal: '¿Desea registrar esta salida de insumo en el sistema?',
      subtitulo: `Cantidad a egresar: ${this.form.value.cantidad}`,
      tipo: 'salida',
      btnConfirmarTexto: 'Registrar Salida',
      btnCancelarTexto: 'Cancelar'
    }).subscribe(confirmado => {
      if (confirmado) {
        this.movimientoService.registrarSalida(this.form.value).subscribe({
          next:() => {
            this.ref.close(true);
          },
          error: (err:any) => {
            const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'Ocurrió un error al guardar el registro.');
            this.confirmacionService.mostrarAdvertencia('Error de validación', msg);
          }
        });
      }
    });
  }

  actualizarSalidaInsumos(){
    // Salidas no se actualizan en el nuevo sistema
    this.cerrarPopup();
  }
}
