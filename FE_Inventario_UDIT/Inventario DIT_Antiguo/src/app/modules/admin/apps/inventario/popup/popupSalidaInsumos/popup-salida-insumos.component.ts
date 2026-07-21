import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MovimientoService } from '@app/core/services/movimiento.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { CatalogoDto } from '@app/core/models';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-popup-salida-insumos',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, MatButtonModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './popup-salida-insumos.component.html',
  styleUrl: './popup-salida-insumos.component.scss'
})
export class PopupSalidaInsumosComponent implements OnInit {
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
    this.movimientoService.registrarSalida(this.form.value).subscribe({
      next:() => {
        this.cerrarPopup();
      }
    });
  }

  actualizarSalidaInsumos(){
    // Salidas no se actualizan en el nuevo sistema
    this.cerrarPopup();
  }
}
