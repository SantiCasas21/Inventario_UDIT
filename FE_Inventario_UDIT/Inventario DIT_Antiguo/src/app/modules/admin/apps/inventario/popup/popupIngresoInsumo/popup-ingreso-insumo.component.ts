import { inject } from '@angular/core';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MovimientoService } from '@app/core/services/movimiento.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { ProyectoService } from '@app/core/services/proyecto.service';
import { CatalogoDto, ProyectoDto } from '@app/core/models';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ConfirmacionService } from '@app/core/services/confirmacion.service';

@Component({
  selector: 'app-popup-ingreso-insumo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatDialogModule, MatIconModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './popup-ingreso-insumo.component.html',
  styleUrl: './popup-ingreso-insumo.component.scss'
})
export class PopupIngresoInsumoComponent implements OnInit {
  confirmacionService = inject(ConfirmacionService);

  inputData:any;
  form:FormGroup;
  proveedores: CatalogoDto[] = [];
  insumos: CatalogoDto[] = [];
  tipocompras: CatalogoDto[] = [];
  proyectos: ProyectoDto[] = [];
  monedasOpciones: string[] = ['COP', 'USD', 'EUR'];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data:any,
    private ref:MatDialogRef<PopupIngresoInsumoComponent>,
    private formBuilder:FormBuilder,
    private movimientoService: MovimientoService,
    private catalogoService: CatalogoService,
    private proyectoService: ProyectoService
  ) {
    this.form = this.formBuilder.group({
      idInsumo: ['', Validators.required],
      cantidad: ['', Validators.required],
      idProveedor: [''],
      idTipoCompra: [''],
      idProyecto: [''],
      fecha: [''],
      precioUnitario: [''],
      moneda: ['COP'],
      observacion: ['']
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
    if (this.data?.data && !this.data.data.moneda) {
      this.form.get('moneda')?.setValue('COP');
    }
    
    this.catalogoService.getAll('proveedor').subscribe(data => this.proveedores = data);
    this.catalogoService.getAll('categoria-insumo').subscribe(data => this.insumos = data);
    this.catalogoService.getAll('tipo-compra').subscribe(data => this.tipocompras = data);
    this.proyectoService.getAll().subscribe(data => this.proyectos = data);
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarIngresoInsumo(){
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmacionService.confirmar({
      titulo: 'Confirmar Ingreso de Insumo',
      mensajePrincipal: '¿Desea registrar este ingreso de insumo en el sistema?',
      subtitulo: `Cantidad: ${this.form.value.cantidad}`,
      tipo: 'ingreso',
      btnConfirmarTexto: 'Registrar Ingreso',
      btnCancelarTexto: 'Cancelar'
    }).subscribe(confirmado => {
      if (confirmado) {
        this.movimientoService.registrarIngreso(this.form.value).subscribe({
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

  actualizarIngresoInsumo(){
    // Ingresos no se actualizan en el nuevo sistema
    this.cerrarPopup();
  }
}
