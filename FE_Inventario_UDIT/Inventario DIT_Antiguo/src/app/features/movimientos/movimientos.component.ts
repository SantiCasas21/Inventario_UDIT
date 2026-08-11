import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
import { Subject, takeUntil, Observable, of } from 'rxjs';
import { map, startWith, switchMap, debounceTime, catchError } from 'rxjs/operators';
import { MovimientoService } from '@app/core/services/movimiento.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { InsumoService } from '@app/core/services/insumo.service';
import { MovimientoDto, MovimientoFilter, MovimientoRequest, PagedResult, CatalogoDto, InsumoDto } from '@app/core/models';
import { ParametricFilterComponent } from '@shared/components/parametric-filter/parametric-filter.component';
import { MOVIMIENTO_FILTER_CONFIG } from '@shared/config/movimiento-filter.config';
import { UserService } from '@app/core/user/user.service';
import { TipoMovimientoBadgePipe } from '@app/shared/pipes/tipo-movimiento-badge.pipe';
import { TipoMovimientoCantidadPipe } from '@app/shared/pipes/tipo-movimiento-cantidad.pipe';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatFormFieldModule, MatSnackBarModule,
    ParametricFilterComponent, MatCardModule, MatAutocompleteModule,
    TipoMovimientoBadgePipe, TipoMovimientoCantidadPipe
  ],
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.scss']
})
export class MovimientosComponent implements OnInit, OnDestroy {
  // Tab: Historial con filtro
  displayedColumns = ['fecha', 'usuarioRegistro', 'tipoMovimiento', 'codigoFabrica', 'ubicaciones', 'cantidad', 'precioUnitario', 'proveedorNombre', 'proyectoNombre', 'observacion'];
  data: MovimientoDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  selectedTabIndex = 3; // Default to Historial
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
  ubicaciones: CatalogoDto[] = [];
  currentInsumoUbicacion: string = '';

  filteredInsumosIngreso!: Observable<InsumoDto[]>;
  filteredInsumosSalida!: Observable<InsumoDto[]>;
  filteredInsumosAjuste!: Observable<InsumoDto[]>;
  filteredNuevaUbicacion!: Observable<CatalogoDto[]>;
  filteredIngresoUbicacion!: Observable<CatalogoDto[]>;
  filteredSalidaUbicacion!: Observable<CatalogoDto[]>;
  filteredAjusteUbicacion!: Observable<CatalogoDto[]>;

  ubicacionesIngreso: any[] = [];
  ubicacionesSalida: any[] = [];
  ubicacionesAjuste: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private movimientoService: MovimientoService,
    private insumoService: InsumoService,
    private catalogoService: CatalogoService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private userService: UserService,
    private route: ActivatedRoute
  ) {
    this.ingresoForm = this.fb.group({
      idInsumo: [null, Validators.required],
      insumoObj: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [null],
      observacion: [''],
      idProveedor: [null],
      idTipoCompra: [null],
      idUbicacion: [null],
      ubicacionObj: [''],
    });

    this.salidaForm = this.fb.group({
      idInsumo: [null, Validators.required],
      insumoObj: [''],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [null],
      observacion: [''],
      idProyecto: [null],
      idEstadoSalida: [null],
      idUbicacion: [null, Validators.required],
      ubicacionObj: ['', Validators.required],
    });

    this.ajusteForm = this.fb.group({
      idInsumo: [null, Validators.required],
      insumoObj: [''],
      cantidad: [1, [Validators.required]],
      observacion: ['', Validators.required],
      idUbicacion: [null, Validators.required],
      ubicacionObj: ['', Validators.required],
      idNuevaUbicacion: [null], // Opcional: nueva ubicación para el insumo
      nuevaUbicacionObj: [''],
    });
  }

  get userRole(): string {
    return this.userService.currentUser?.role || '';
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'ingresos') {
        this.selectedTabIndex = 0;
        if (params['q']) {
          this.ingresoForm.get('insumoObj')?.setValue(params['q']);
        }
      }
    });

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
    // Los insumos se cargarán bajo demanda en el autocompletado
    this.initInsumosFilters();
    this.catalogoService.getAll('proveedor').pipe(takeUntil(this.destroy$)).subscribe(r => this.proveedores = r);
    this.catalogoService.getAll('tipo-compra').pipe(takeUntil(this.destroy$)).subscribe(r => this.tiposCompra = r);
    this.catalogoService.getAll('proyecto').pipe(takeUntil(this.destroy$)).subscribe(r => this.proyectos = r as unknown as CatalogoDto[]);
    this.catalogoService.getAll('estado-salida').pipe(takeUntil(this.destroy$)).subscribe(r => this.estadosSalida = r);
    this.catalogoService.getAll('ubicacion').pipe(takeUntil(this.destroy$)).subscribe(r => {
      this.ubicaciones = r;
      // Re-trigger autocompletes so they don't stay empty
      this.ingresoForm.get('ubicacionObj')?.updateValueAndValidity();
      this.ajusteForm.get('nuevaUbicacionObj')?.updateValueAndValidity();
    });
  }

  initInsumosFilters() {
    this.filteredInsumosIngreso = this.setupInsumoAutocomplete(this.ingresoForm, 'INGRESO');
    this.filteredInsumosSalida = this.setupInsumoAutocomplete(this.salidaForm, 'SALIDA');
    this.filteredInsumosAjuste = this.setupInsumoAutocomplete(this.ajusteForm, 'AJUSTE');

    // Autocompletado para Nueva Ubicación en Ajuste (Solo ubicaciones sin stock de este insumo)
    this.filteredNuevaUbicacion = this.ajusteForm.get('nuevaUbicacionObj')!.valueChanges.pipe(
      startWith(''),
      map(val => {
        let search = '';
        if (typeof val === 'string') {
          search = val;
          if (search === '') this.ajusteForm.get('idNuevaUbicacion')?.setValue(null);
        } else if (val && val.nombre) {
          search = val.nombre;
          this.ajusteForm.get('idNuevaUbicacion')?.setValue(val.id);
        }
        const lower = search.toLowerCase();
        
        // Excluir solo la ubicación origen seleccionada actualmente
        const origenId = this.ajusteForm.get('idUbicacion')?.value;
        const ubicacionesDisponibles = this.ubicaciones.filter(u => u.id !== origenId);
        
        return ubicacionesDisponibles
          .filter(u => u.nombre.toLowerCase().includes(lower))
          .map(u => {
            const matching = this.ubicacionesAjuste.find(us => us.id === u.id);
            return { ...u, stock: matching ? matching.stock : 0 };
          })
          .sort((a, b) => {
            if (a.stock > 0 && b.stock === 0) return -1;
            if (a.stock === 0 && b.stock > 0) return 1;
            return a.nombre.localeCompare(b.nombre);
          });
      })
    );

    // Autocompletado para Ubicación en Ingreso
    this.filteredIngresoUbicacion = this.setupUbicacionAutocomplete(this.ingresoForm, 'ubicacionObj', 'idUbicacion', () => {
      return this.ubicaciones.map(u => {
        const matching = this.ubicacionesIngreso.find(us => us.id === u.id);
        return { ...u, stock: matching ? matching.stock : 0 };
      }).sort((a, b) => {
        if (a.stock > 0 && b.stock === 0) return -1;
        if (a.stock === 0 && b.stock > 0) return 1;
        return a.nombre.localeCompare(b.nombre);
      });
    });
    // Autocompletado para Ubicación en Salida
    this.filteredSalidaUbicacion = this.setupUbicacionAutocomplete(this.salidaForm, 'ubicacionObj', 'idUbicacion', () => this.ubicacionesSalida);
    // Autocompletado para Ubicación origen en Ajuste
    this.filteredAjusteUbicacion = this.setupUbicacionAutocomplete(this.ajusteForm, 'ubicacionObj', 'idUbicacion', () => this.ubicacionesAjuste);
  }

  private setupUbicacionAutocomplete(form: FormGroup, objControl: string, idControl: string, getList: () => any[]): Observable<any[]> {
    return form.get(objControl)!.valueChanges.pipe(
      startWith(''),
      map(val => {
        let search = '';
        if (typeof val === 'string') {
          search = val;
          if (search === '') form.get(idControl)?.setValue(null);
        } else if (val && val.nombre) {
          search = val.nombre;
          form.get(idControl)?.setValue(val.id);
        }
        const lower = search.toLowerCase();
        return getList().filter(u => u.nombre.toLowerCase().includes(lower));
      })
    );
  }

  displayFnUbicacion(item?: CatalogoDto): string {
    return item ? item.nombre : '';
  }

  private setupInsumoAutocomplete(form: FormGroup, type: 'INGRESO' | 'SALIDA' | 'AJUSTE'): Observable<InsumoDto[]> {
    return form.get('insumoObj')!.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(val => {
        let search = '';
        if (typeof val === 'string') {
          search = val;
          if (search === '') form.get('idInsumo')?.setValue(null);
        } else if (val && val.codigoFabrica) {
          search = val.codigoFabrica;
          form.get('idInsumo')?.setValue(val.id);
        }

        // Cargar ubicaciones basadas en el insumo seleccionado y el tipo de movimiento
        if (val && typeof val !== 'string' && val.ubicacionesStock) {
          const ubicacionesDelInsumo = val.ubicacionesStock.map((u: any) => ({ id: u.idUbicacion, nombre: u.ubicacionNombre, stock: u.stock }));
          if (type === 'INGRESO') {
            this.ubicacionesIngreso = ubicacionesDelInsumo;
            if (ubicacionesDelInsumo.length > 0) {
              const ubi = { id: ubicacionesDelInsumo[0].id, nombre: ubicacionesDelInsumo[0].nombre };
              form.get('ubicacionObj')?.setValue(ubi);
              form.get('idUbicacion')?.setValue(ubi.id);
            } else {
              form.get('ubicacionObj')?.setValue('');
            }
          } else if (type === 'SALIDA') {
            this.ubicacionesSalida = ubicacionesDelInsumo.filter((u: any) => u.stock > 0);
            form.get('ubicacionObj')?.setValue('');
          } else if (type === 'AJUSTE') {
            this.ubicacionesAjuste = ubicacionesDelInsumo;
            form.get('ubicacionObj')?.setValue('');
            this.ajusteForm.get('nuevaUbicacionObj')?.updateValueAndValidity();
          }
        } else if (typeof val === 'string' && val === '') {
          if (type === 'INGRESO') this.ubicacionesIngreso = [];
          if (type === 'SALIDA') this.ubicacionesSalida = [];
          if (type === 'AJUSTE') {
            this.ubicacionesAjuste = [];
            this.ajusteForm.get('nuevaUbicacionObj')?.updateValueAndValidity();
          }
        }

        // Búsqueda en backend con paginación optimizada
        return this.insumoService.filter({ textSearch: search, pageSize: 200 }).pipe(
          map(res => {
            if (type === 'SALIDA') {
              return res.items.filter(i => i.cantidad > 0);
            }
            return res.items;
          }),
          catchError(() => of([]))
        );
      })
    );
  }

  displayFnInsumo(item?: InsumoDto): string {
    return item ? item.codigoFabrica : '';
  }

  // ==================== Registrar Ingreso ====================
  registrarIngreso(): void {
    if (this.ingresoForm.invalid) return;
    const req: MovimientoRequest = {
      ...this.ingresoForm.value,
      usuarioRegistro: this.userService.currentUser?.email || this.userService.currentUser?.nombreCompleto || undefined,
    };
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
    const req: MovimientoRequest = {
      ...this.salidaForm.value,
      usuarioRegistro: this.userService.currentUser?.email || this.userService.currentUser?.nombreCompleto || undefined,
    };
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
    const formValue = this.ajusteForm.value;
    const req: MovimientoRequest = {
      idInsumo: formValue.idInsumo,
      idUbicacion: formValue.idUbicacion,
      cantidad: formValue.cantidad,
      observacion: formValue.observacion,
    };
    // Solo incluir idNuevaUbicacion si se seleccionó una diferente
    if (formValue.idNuevaUbicacion) {
      req.idNuevaUbicacion = formValue.idNuevaUbicacion;
    }
    // Incluir el usuario autenticado para auditoría
    req.usuarioRegistro = this.userService.currentUser?.email || this.userService.currentUser?.nombreCompleto || undefined;
    this.movimientoService.registrarAjuste(req).subscribe({
      next: () => {
        this.snackBar.open('Ajuste registrado exitosamente', 'Cerrar', { duration: 3000 });
        this.ajusteForm.reset({ cantidad: 1 });
        this.currentInsumoUbicacion = '';
        this.loadHistorial();
      },
      error: (err) => this.snackBar.open('Error: ' + (err.message || 'Error'), 'Cerrar', { duration: 5000 }),
    });
  }
}
