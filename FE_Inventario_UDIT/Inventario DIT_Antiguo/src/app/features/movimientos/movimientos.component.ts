import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { MovimientoService } from '@app/core/services/movimiento.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { InsumoService } from '@app/core/services/insumo.service';
import { MovimientoDto, MovimientoFilter, MovimientoRequest, PagedResult, CatalogoDto, InsumoDto } from '@app/core/models';
import { ParametricFilterComponent } from '@shared/components/parametric-filter/parametric-filter.component';
import { MOVIMIENTO_FILTER_CONFIG } from '@shared/config/movimiento-filter.config';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatFormFieldModule, MatSnackBarModule,
    ParametricFilterComponent,
  ],
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.scss']
})
export class MovimientosComponent implements OnInit, OnDestroy {
  // Tab: Historial con filtro
  displayedColumns = ['fecha', 'tipoMovimiento', 'codigoFabrica', 'cantidad', 'precioUnitario', 'proveedorNombre', 'proyectoNombre', 'observacion'];
  data: MovimientoDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  filterConfig = MOVIMIENTO_FILTER_CONFIG;
  currentFilter: MovimientoFilter = { page: 1, pageSize: 20 };

  // Tab: Formulario Ingreso
  ingresoForm: FormGroup;

  // Tab: Formulario Salida
  salidaForm: FormGroup;

  // Catálogos para selects
  insumos: InsumoDto[] = [];
  proveedores: CatalogoDto[] = [];
  tiposCompra: CatalogoDto[] = [];
  proyectos: CatalogoDto[] = [];
  estadosSalida: CatalogoDto[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private movimientoService: MovimientoService,
    private insumoService: InsumoService,
    private catalogoService: CatalogoService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
  ) {
    this.ingresoForm = this.fb.group({
      idInsumo: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [null],
      observacion: [''],
      idProveedor: [null],
      idTipoCompra: [null],
    });

    this.salidaForm = this.fb.group({
      idInsumo: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [null],
      observacion: [''],
      idProyecto: [null],
      idEstadoSalida: [null],
    });
  }

  ngOnInit(): void {
    this.loadHistorial();
    this.loadCatalogos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ==================== Historial ====================
  loadHistorial(): void {
    this.loading = true;
    const filter = { ...this.currentFilter, page: this.page, pageSize: this.pageSize, sortBy: 'fecha', sortDescending: true };

    this.movimientoService.filter(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: PagedResult<MovimientoDto>) => {
          this.data = result.items;
          this.totalCount = result.totalCount;
          this.loading = false;
        },
        error: (err) => {
          this.snackBar.open('Error al cargar movimientos: ' + (err.message || 'Error'), 'Cerrar', { duration: 5000 });
          this.loading = false;
        }
      });
  }

  onFilterChange(filter: Record<string, unknown>): void {
    const f: MovimientoFilter = { page: 1, pageSize: this.pageSize };
    // Mapear filtros UI → DTO
    if (filter['tiposMovimiento'] && Array.isArray(filter['tiposMovimiento'])) {
      f.tiposMovimiento = filter['tiposMovimiento'] as string[];
    }
    if (filter['idsInsumo'] && Array.isArray(filter['idsInsumo'])) {
      f.idsInsumo = filter['idsInsumo'] as number[];
    }
    if (filter['idsProveedor'] && Array.isArray(filter['idsProveedor'])) {
      f.idsProveedor = filter['idsProveedor'] as number[];
    }
    if (filter['idsProyecto'] && Array.isArray(filter['idsProyecto'])) {
      f.idsProyecto = filter['idsProyecto'] as number[];
    }
    if (filter['idsTipoCompra'] && Array.isArray(filter['idsTipoCompra'])) {
      f.idsTipoCompra = filter['idsTipoCompra'] as number[];
    }
    if (filter['idsEstadoSalida'] && Array.isArray(filter['idsEstadoSalida'])) {
      f.idsEstadoSalida = filter['idsEstadoSalida'] as number[];
    }
    if (filter['cantidadRange']) {
      const r = filter['cantidadRange'] as { min?: string; max?: string };
      if (r.min) f.cantidadMin = parseFloat(r.min);
      if (r.max) f.cantidadMax = parseFloat(r.max);
    }
    if (filter['precioRange']) {
      const r = filter['precioRange'] as { min?: string; max?: string };
      if (r.min) f.precioUnitarioMin = parseFloat(r.min);
      if (r.max) f.precioUnitarioMax = parseFloat(r.max);
    }
    if (filter['fechaRange']) {
      const r = filter['fechaRange'] as { min?: string; max?: string };
      if (r.min) f.fechaDesde = r.min;
      if (r.max) f.fechaHasta = r.max;
    }
    if (filter['textSearch']) f.textSearch = filter['textSearch'] as string;

    this.currentFilter = f;
    this.page = 1;
    this.loadHistorial();
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadHistorial();
  }

  loadCatalogos(): void {
    this.insumoService.filter({}).pipe(takeUntil(this.destroy$)).subscribe(r => this.insumos = r.items);
    this.catalogoService.getAll('proveedor').pipe(takeUntil(this.destroy$)).subscribe(r => this.proveedores = r);
    this.catalogoService.getAll('tipo-compra').pipe(takeUntil(this.destroy$)).subscribe(r => this.tiposCompra = r);
    this.catalogoService.getAll('proyecto').pipe(takeUntil(this.destroy$)).subscribe(r => this.proyectos = r as unknown as CatalogoDto[]);
    this.catalogoService.getAll('estado-salida').pipe(takeUntil(this.destroy$)).subscribe(r => this.estadosSalida = r);
  }

  // ==================== Registrar Ingreso ====================
  registrarIngreso(): void {
    if (this.ingresoForm.invalid) return;
    const req: MovimientoRequest = this.ingresoForm.value;
    this.movimientoService.registrarIngreso(req).subscribe({
      next: () => {
        this.snackBar.open('Ingreso registrado exitosamente', 'Cerrar', { duration: 3000 });
        this.ingresoForm.reset({ cantidad: 1 });
        this.loadHistorial();
      },
      error: (err) => this.snackBar.open('Error: ' + (err.message || 'Error'), 'Cerrar', { duration: 5000 }),
    });
  }

  // ==================== Registrar Salida ====================
  registrarSalida(): void {
    if (this.salidaForm.invalid) return;
    const req: MovimientoRequest = this.salidaForm.value;
    this.movimientoService.registrarSalida(req).subscribe({
      next: () => {
        this.snackBar.open('Salida registrada exitosamente', 'Cerrar', { duration: 3000 });
        this.salidaForm.reset({ cantidad: 1 });
        this.loadHistorial();
      },
      error: (err) => this.snackBar.open('Error: ' + (err.message || 'Error'), 'Cerrar', { duration: 5000 }),
    });
  }
}
