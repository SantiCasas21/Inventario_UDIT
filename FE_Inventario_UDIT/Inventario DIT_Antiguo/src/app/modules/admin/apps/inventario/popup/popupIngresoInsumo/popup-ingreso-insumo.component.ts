import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MovimientoService } from '@app/core/services/movimiento.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { ProyectoService } from '@app/core/services/proyecto.service';
import { CatalogoDto, ProyectoDto } from '@app/core/models';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-ingreso-insumo',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './popup-ingreso-insumo.component.html',
  styleUrl: './popup-ingreso-insumo.component.scss'
})
export class PopupIngresoInsumoComponent implements OnInit {
  inputData:any;
  form:FormGroup;
  proveedores: CatalogoDto[] = [];
  insumos: CatalogoDto[] = [];
  tipocompras: CatalogoDto[] = [];
  proyectos: ProyectoDto[] = [];

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
      observacion: ['']
    });
  }

  ngOnInit(): void {
    this.form.patchValue(this.data.data);
    this.catalogoService.getAll('proveedor').subscribe(data => this.proveedores = data);
    this.catalogoService.getAll('categoria-insumo').subscribe(data => this.insumos = data);
    this.catalogoService.getAll('tipo-compra').subscribe(data => this.tipocompras = data);
    this.proyectoService.getAll().subscribe(data => this.proyectos = data);
  }

  cerrarPopup() {
    this.ref.close();
  }

  guardarIngresoInsumo(){
    this.movimientoService.registrarIngreso(this.form.value).subscribe({
      next:() => {
        this.cerrarPopup();
      }
    });
  }

  actualizarIngresoInsumo(){
    // Ingresos no se actualizan en el nuevo sistema
    this.cerrarPopup();
  }
}
