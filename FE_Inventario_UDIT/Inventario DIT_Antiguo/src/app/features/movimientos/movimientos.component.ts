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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { Subject, takeUntil, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MovimientoService } from '@app/core/services/movimiento.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { InsumoService } from '@app/core/services/insumo.service';
import { MovimientoDto, MovimientoFilter, MovimientoRequest, PagedResult, CatalogoDto, InsumoDto } from '@app/core/models';
import { ParametricFilterComponent } from '@shared/components/parametric-filter/parametric-filter.component';
import { MOVIMIENTO_FILTER_CONFIG } from '@shared/config/movimiento-filter.config';
import { UserService } from '@app/core/user/user.service';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatFormFieldModule, MatSnackBarModule,
    ParametricFilterComponent, MatCardModule, MatAutocompleteModule,
  ],
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.scss']
})
export class MovimientosComponent implements OnInit, OnDestroy {
  // Tab: Historial con filtro
  displayedColumns = ['fecha', 'tipoMovimiento', 'codigoFabrica', 'insumoUbicacion', 'cantidad', 'precioUnitario', 'proveedorNombre', 'proyectoNombre', 'observacion'];
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

  // Tab: Formulario Ajuste
  ajusteForm: FormGroup;

  // Catálogos para selects
  insumos: InsumoDto[] = [];
  proveedores: CatalogoDto[] = [];
  tiposCompra: CatalogoDto[] = [];
  proyectos: CatalogoDto[] = [];
  estadosSalida: CatalogoDto[] = [];

  filteredInsumosIngreso!: Observable<InsumoDto[]>;
  filteredInsumosSalida!: Observable<InsumoDto[]>;
  filteredInsumosAjuste!: Observable<InsumoDto[]>;

  private destroy$ = new Subject<void>();

  constructor(
    private movimientoService: MovimientoService,
    private insumoService: InsumoService,
    private catalogoService: CatalogoService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private userService: UserService,
  ) {
    this.ingresoForm = this.fb.group({
      idInsumo: [null, Validators.required],
      insumoObj: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [null],
      observacion: [''],
      idProveedor: [null],
      idTipoCompra: [null],
    });

    this.salidaForm = this.fb.group({
      idInsumo: [null, Validators.required],
      insumoObj: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [null],
      observacion: [''],
      idProyecto: [null],
      idEstadoSalida: [null],
    });

    this.ajusteForm = this.fb.group({
      idInsumo: [null, Validators.required],
      insumoObj: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      observacion: ['', Validators.required],
    });
  }

  get userRole(): string {
    return this.userService.currentUser?.role || '';
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
    if (filter['idsCategoria'] && Array.isArray(filter['idsCategoria'])) {
      f.idsCategoria = filter['idsCategoria'] as number[];
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
    if (filter['fechaRange']) {
      const r = filter['fechaRange'] as { min?: string; max?: string };
      if (r.min) f.fechaDesde = r.min;
      if (r.max) f.fechaHasta = r.max;
    }
    if (filter['codigoFabricaSearch']) f.codigoFabricaSearch = filter['codigoFabricaSearch'] as string;

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
    this.insumoService.filter({}).pipe(takeUntil(this.destroy$)).subscribe(r => {
      this.insumos = r.items;
      this.initInsumosFilters();
    });
    this.catalogoService.getAll('proveedor').pipe(takeUntil(this.destroy$)).subscribe(r => this.proveedores = r);
    this.catalogoService.getAll('tipo-compra').pipe(takeUntil(this.destroy$)).subscribe(r => this.tiposCompra = r);
    this.catalogoService.getAll('proyecto').pipe(takeUntil(this.destroy$)).subscribe(r => this.proyectos = r as unknown as CatalogoDto[]);
    this.catalogoService.getAll('estado-salida').pipe(takeUntil(this.destroy$)).subscribe(r => this.estadosSalida = r);
  }

  initInsumosFilters() {
    this.filteredInsumosIngreso = this.ingresoForm.get('insumoObj')!.valueChanges.pipe(
      startWith(''),
      map(val => this._filterInsumo(val, this.ingresoForm, 'idInsumo'))
    );
    this.filteredInsumosSalida = this.salidaForm.get('insumoObj')!.valueChanges.pipe(
      startWith(''),
      map(val => this._filterInsumo(val, this.salidaForm, 'idInsumo'))
    );
    this.filteredInsumosAjuste = this.ajusteForm.get('insumoObj')!.valueChanges.pipe(
      startWith(''),
      map(val => this._filterInsumo(val, this.ajusteForm, 'idInsumo'))
    );
  }

  private _filterInsumo(val: string | InsumoDto, form: FormGroup, targetControl: string): InsumoDto[] {
    let search = '';
    if (typeof val === 'string') {
      search = val;
      if (search === '') form.get(targetControl)?.setValue(null);
    } else if (val && val.codigoFabrica) {
      search = val.codigoFabrica;
      form.get(targetControl)?.setValue(val.id);
    }

    const filterValue = search.toLowerCase();
    return this.insumos.filter(option => 
      option.codigoFabrica.toLowerCase().includes(filterValue) || 
      (option.descripcion && option.descripcion.toLowerCase().includes(filterValue))
    );
  }

  displayFnInsumo(item?: InsumoDto): string {
    return item ? `${item.codigoFabrica} - ${item.descripcion}` : '';
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

  // ==================== Registrar Ajuste ====================
  registrarAjuste(): void {
    if (this.ajusteForm.invalid) return;
    const req: MovimientoRequest = this.ajusteForm.value;
    this.movimientoService.registrarAjuste(req).subscribe({
      next: () => {
        this.snackBar.open('Ajuste registrado exitosamente', 'Cerrar', { duration: 3000 });
        this.ajusteForm.reset({ cantidad: 1 });
        this.loadHistorial();
      },
      error: (err) => this.snackBar.open('Error: ' + (err.message || 'Error'), 'Cerrar', { duration: 5000 }),
    });
  }
}
