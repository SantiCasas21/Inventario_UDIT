import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil, Observable, of } from 'rxjs';
import { map, startWith, switchMap, debounceTime, catchError, tap } from 'rxjs/operators';
import { MovimientoService } from '@app/core/services/movimiento.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { InsumoService } from '@app/core/services/insumo.service';
import { MovimientoDto, MovimientoFilter, MovimientoRequest, PagedResult, CatalogoDto, InsumoDto } from '@app/core/models';
import { ParametricFilterComponent } from '@shared/components/parametric-filter/parametric-filter.component';
import { MOVIMIENTO_FILTER_CONFIG } from '@shared/config/movimiento-filter.config';
import { UserService } from '@app/core/user/user.service';
import { TipoMovimientoBadgePipe } from '@app/shared/pipes/tipo-movimiento-badge.pipe';
import { TipoMovimientoCantidadPipe } from '@app/shared/pipes/tipo-movimiento-cantidad.pipe';
import { PopupInsumosComponent } from 'app/modules/admin/apps/inventario/popup/popupInsumos/popup-insumos.component';
import { PopupImportIngresosComponent } from './popup-import-ingresos/popup-import-ingresos.component';
import { ConfirmacionService } from '@app/core/services/confirmacion.service';


function nonZeroValidator(control: AbstractControl) {
  const val = control.value;
  if (val === null || val === undefined || val === '' || Number(val) === 0) {
    return { nonZero: true };
  }
  return null;
}

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatTableModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatFormFieldModule, MatSnackBarModule,
    ParametricFilterComponent, MatCardModule, MatAutocompleteModule,
    MatTooltipModule, MatDialogModule,
    TipoMovimientoBadgePipe, TipoMovimientoCantidadPipe,
    PopupImportIngresosComponent
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

  // Búsqueda y estado de coincidencias
  ingresoSearchTerm = '';
  salidaSearchTerm = '';
  ajusteSearchTerm = '';

  noMatchIngreso = false;
  noMatchSalida = false;
  noMatchAjuste = false;

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
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private confirmacionService: ConfirmacionService
  ) {
    this.ingresoForm = this.fb.group({
      idInsumo: [null, Validators.required],
      insumoObj: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(1)]],
      precioUnitario: [null],
      observacion: [''],
      idProveedor: [null],
      idTipoCompra: [null],
      idUbicacion: [null],
      ubicacionObj: [''],
    });

    this.salidaForm = this.fb.group({
      idInsumo: [null, Validators.required],
      insumoObj: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(1)]],
      precioUnitario: [null],
      observacion: [''],
      idProyecto: [null],
      idEstadoSalida: [null],
      idUbicacion: [null, Validators.required],
      ubicacionObj: ['', Validators.required],
    });

    this.ajusteForm = this.fb.group({
      idInsumo: [null, Validators.required],
      insumoObj: ['', Validators.required],
      cantidad: [0, [Validators.required, nonZeroValidator]],
      observacion: ['', Validators.required],
      idUbicacion: [null, Validators.required],
      ubicacionObj: ['', Validators.required],
      idNuevaUbicacion: [null],
      nuevaUbicacionObj: [''],
    });
  }

  get userRole(): string {
    return this.userService.currentUser?.role || '';
  }

  get canCreateInsumo(): boolean {
    return this.userService.hasPermission('insumos.crear') || this.userService.hasRole(['Admin', 'Developer']);
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
    this.initInsumosFilters();
    this.catalogoService.getAll('proveedor').pipe(takeUntil(this.destroy$)).subscribe(r => this.proveedores = (r || []).filter(p => p && p.nombre?.trim()));
    this.catalogoService.getAll('tipo-compra').pipe(takeUntil(this.destroy$)).subscribe(r => this.tiposCompra = (r || []).filter(t => t && t.nombre?.trim()));
    this.catalogoService.getAll('proyecto').pipe(takeUntil(this.destroy$)).subscribe(r => this.proyectos = (r || []).filter(p => p && p.nombre?.trim()) as unknown as CatalogoDto[]);
    this.catalogoService.getAll('estado-salida').pipe(takeUntil(this.destroy$)).subscribe(r => this.estadosSalida = (r || []).filter(e => e && e.nombre?.trim()));
    this.catalogoService.getAll('ubicacion').pipe(takeUntil(this.destroy$)).subscribe(r => {
      // Filtrar estrictamente ubicaciones no nulas y con nombre válido (evita opciones vacías)
      this.ubicaciones = (r || []).filter(u => u && u.nombre && u.nombre.trim().length > 0);
      this.ingresoForm.get('ubicacionObj')?.updateValueAndValidity();
      this.ajusteForm.get('nuevaUbicacionObj')?.updateValueAndValidity();
    });
  }

  initInsumosFilters() {
    this.filteredInsumosIngreso = this.setupInsumoAutocomplete(this.ingresoForm, 'INGRESO');
    this.filteredInsumosSalida = this.setupInsumoAutocomplete(this.salidaForm, 'SALIDA');
    this.filteredInsumosAjuste = this.setupInsumoAutocomplete(this.ajusteForm, 'AJUSTE');

    // Autocompletado para Nueva Ubicación en Ajuste (Ubicaciones válidas con nombre)
    this.filteredNuevaUbicacion = this.ajusteForm.get('nuevaUbicacionObj')!.valueChanges.pipe(
      startWith(''),
      map(val => {
        let search = '';
        if (typeof val === 'string') {
          search = val.trim();
          if (search === '') this.ajusteForm.get('idNuevaUbicacion')?.setValue(null);
        } else if (val && val.nombre) {
          search = val.nombre.trim();
          this.ajusteForm.get('idNuevaUbicacion')?.setValue(val.id);
        }
        const lower = search.toLowerCase();
        
        // Excluir la ubicación origen seleccionada actualmente
        const origenId = this.ajusteForm.get('idUbicacion')?.value;
        const ubicacionesDisponibles = this.ubicaciones.filter(u => u && u.id !== origenId && u.nombre && u.nombre.trim().length > 0);
        
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
      return this.ubicaciones
        .filter(u => u && u.nombre && u.nombre.trim().length > 0)
        .map(u => {
          const matching = this.ubicacionesIngreso.find(us => us.id === u.id);
          return { ...u, stock: matching ? matching.stock : 0 };
        }).sort((a, b) => {
          if (a.stock > 0 && b.stock === 0) return -1;
          if (a.stock === 0 && b.stock > 0) return 1;
          return a.nombre.localeCompare(b.nombre);
        });
    });

    // Autocompletado para Ubicación en Salida
    this.filteredSalidaUbicacion = this.setupUbicacionAutocomplete(this.salidaForm, 'ubicacionObj', 'idUbicacion', () => {
      return this.ubicacionesSalida.filter(u => u && u.nombre && u.nombre.trim().length > 0);
    });

    // Autocompletado para Ubicación origen en Ajuste
    this.filteredAjusteUbicacion = this.setupUbicacionAutocomplete(this.ajusteForm, 'ubicacionObj', 'idUbicacion', () => {
      return this.ubicacionesAjuste.filter(u => u && u.nombre && u.nombre.trim().length > 0);
    });
  }

  private setupUbicacionAutocomplete(form: FormGroup, objControl: string, idControl: string, getList: () => any[]): Observable<any[]> {
    return form.get(objControl)!.valueChanges.pipe(
      startWith(''),
      map(val => {
        let search = '';
        if (typeof val === 'string') {
          search = val.trim();
          if (search === '') form.get(idControl)?.setValue(null);
        } else if (val && val.nombre) {
          search = val.nombre.trim();
          form.get(idControl)?.setValue(val.id);
        }
        const lower = search.toLowerCase();
        return getList()
          .filter(u => u && u.nombre && u.nombre.trim().length > 0)
          .filter(u => u.nombre.toLowerCase().includes(lower));
      })
    );
  }

  displayFnUbicacion(item?: CatalogoDto): string {
    return item && item.nombre ? item.nombre : '';
  }

  private setupInsumoAutocomplete(form: FormGroup, type: 'INGRESO' | 'SALIDA' | 'AJUSTE'): Observable<InsumoDto[]> {
    return form.get('insumoObj')!.valueChanges.pipe(
      startWith(''),
      debounceTime(250),
      tap(val => {
        // Regla inteligente de reseteo: si el usuario escribe o limpia el texto, se vacía la ubicación
        if (typeof val === 'string') {
          const trimmed = val.trim();
          if (type === 'INGRESO') this.ingresoSearchTerm = trimmed;
          else if (type === 'SALIDA') this.salidaSearchTerm = trimmed;
          else if (type === 'AJUSTE') this.ajusteSearchTerm = trimmed;

          form.get('idInsumo')?.setValue(null);
          form.get('idUbicacion')?.setValue(null);
          form.get('ubicacionObj')?.setValue('');

          if (type === 'INGRESO') this.ubicacionesIngreso = [];
          if (type === 'SALIDA') this.ubicacionesSalida = [];
          if (type === 'AJUSTE') {
            this.ubicacionesAjuste = [];
            this.ajusteForm.get('nuevaUbicacionObj')?.updateValueAndValidity();
          }
        }
      }),
      switchMap(val => {
        let search = '';
        if (typeof val === 'string') {
          search = val.trim();
        } else if (val && val.codigoFabrica) {
          search = val.codigoFabrica.trim();
          form.get('idInsumo')?.setValue(val.id);

          // Cargar y sincronizar ubicaciones del insumo seleccionado
          const ubicacionesDelInsumo = (val.ubicacionesStock || []).map((u: any) => ({
            id: u.idUbicacion,
            nombre: u.ubicacionNombre,
            stock: u.stock
          })).filter((u: any) => u && u.nombre && u.nombre.trim().length > 0);

          if (type === 'INGRESO') {
            this.ubicacionesIngreso = ubicacionesDelInsumo;
            // Si tiene una ubicación asociada, seleccionarla automáticamente; si no, dejar vacío
            if (ubicacionesDelInsumo.length > 0) {
              const ubi = { id: ubicacionesDelInsumo[0].id, nombre: ubicacionesDelInsumo[0].nombre };
              form.get('ubicacionObj')?.setValue(ubi);
              form.get('idUbicacion')?.setValue(ubi.id);
            } else {
              form.get('ubicacionObj')?.setValue('');
              form.get('idUbicacion')?.setValue(null);
            }
          } else if (type === 'SALIDA') {
            this.ubicacionesSalida = ubicacionesDelInsumo.filter((u: any) => u.stock > 0);
            if (this.ubicacionesSalida.length === 1) {
              const ubi = this.ubicacionesSalida[0];
              form.get('ubicacionObj')?.setValue(ubi);
              form.get('idUbicacion')?.setValue(ubi.id);
            } else {
              form.get('ubicacionObj')?.setValue('');
              form.get('idUbicacion')?.setValue(null);
            }
          } else if (type === 'AJUSTE') {
            this.ubicacionesAjuste = ubicacionesDelInsumo;
            if (this.ubicacionesAjuste.length === 1) {
              const ubi = this.ubicacionesAjuste[0];
              form.get('ubicacionObj')?.setValue(ubi);
              form.get('idUbicacion')?.setValue(ubi.id);
            } else {
              form.get('ubicacionObj')?.setValue('');
              form.get('idUbicacion')?.setValue(null);
            }
            this.ajusteForm.get('nuevaUbicacionObj')?.updateValueAndValidity();
          }

          if (type === 'INGRESO') this.noMatchIngreso = false;
          else if (type === 'SALIDA') this.noMatchSalida = false;
          else if (type === 'AJUSTE') this.noMatchAjuste = false;

          return of([val]);
        }

        // Búsqueda en backend
        return this.insumoService.filter({ textSearch: search, pageSize: 200 }).pipe(
          map(res => {
            let items = res.items || [];
            if (type === 'SALIDA') {
              items = items.filter(i => i.cantidad > 0);
            }
            
            const hasNoMatches = items.length === 0 && search.length > 0;
            if (type === 'INGRESO') this.noMatchIngreso = hasNoMatches;
            else if (type === 'SALIDA') this.noMatchSalida = hasNoMatches;
            else if (type === 'AJUSTE') this.noMatchAjuste = hasNoMatches;

            return items;
          }),
          catchError(() => {
            if (type === 'INGRESO') this.noMatchIngreso = search.length > 0;
            else if (type === 'SALIDA') this.noMatchSalida = search.length > 0;
            else if (type === 'AJUSTE') this.noMatchAjuste = search.length > 0;
            return of([]);
          })
        );
      })
    );
  }

  displayFnInsumo(item?: InsumoDto): string {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.descripcion ? `${item.codigoFabrica} - ${item.descripcion}` : item.codigoFabrica;
  }

  limpiarInsumo(type: 'INGRESO' | 'SALIDA' | 'AJUSTE'): void {
    const form = type === 'INGRESO' ? this.ingresoForm : (type === 'SALIDA' ? this.salidaForm : this.ajusteForm);
    form.get('insumoObj')?.setValue('');
    form.get('idInsumo')?.setValue(null);
    form.get('ubicacionObj')?.setValue('');
    form.get('idUbicacion')?.setValue(null);

    if (type === 'INGRESO') {
      this.ingresoSearchTerm = '';
      this.noMatchIngreso = false;
      this.ubicacionesIngreso = [];
    } else if (type === 'SALIDA') {
      this.salidaSearchTerm = '';
      this.noMatchSalida = false;
      this.ubicacionesSalida = [];
    } else if (type === 'AJUSTE') {
      this.ajusteSearchTerm = '';
      this.noMatchAjuste = false;
      this.ubicacionesAjuste = [];
      this.ajusteForm.get('nuevaUbicacionObj')?.updateValueAndValidity();
    }
  }

  crearNuevoInsumoDesdeMovimiento(type: 'INGRESO' | 'SALIDA' | 'AJUSTE', event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.canCreateInsumo) {
      this.snackBar.open('No tienes permisos para registrar nuevos insumos. Contacta a un Administrador.', 'Cerrar', {
        duration: 5000,
        panelClass: ['bg-amber-600', 'text-white']
      });
      return;
    }

    const searchTerm = type === 'INGRESO' ? this.ingresoSearchTerm : (type === 'SALIDA' ? this.salidaSearchTerm : this.ajusteSearchTerm);

    const dialogRef = this.dialog.open(PopupInsumosComponent, {
      width: '520px',
      enterAnimationDuration: '250ms',
      exitAnimationDuration: '200ms',
      data: {
        estado: 1,
        data: {
          codigoFabrica: (searchTerm || '').trim()
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const codigo = result.codigoFabrica || searchTerm || '';
        this.snackBar.open(`Insumo "${codigo}" creado exitosamente`, 'Cerrar', { duration: 3500 });
        
        // Cargar inmediatamente el insumo creado y seleccionarlo en el formulario activo
        this.insumoService.filter({ textSearch: codigo, pageSize: 10 }).subscribe(res => {
          const found = (res.items || []).find(i => i.codigoFabrica.toLowerCase() === codigo.toLowerCase()) || res.items[0];
          if (found) {
            const form = type === 'INGRESO' ? this.ingresoForm : (type === 'SALIDA' ? this.salidaForm : this.ajusteForm);
            form.get('insumoObj')?.setValue(found);
            form.get('idInsumo')?.setValue(found.id);

            // Sincronizar ubicación si tiene
            if (found.ubicacionesStock && found.ubicacionesStock.length > 0) {
              const ubi = { id: found.ubicacionesStock[0].idUbicacion, nombre: found.ubicacionesStock[0].ubicacionNombre };
              form.get('ubicacionObj')?.setValue(ubi);
              form.get('idUbicacion')?.setValue(ubi.id);
            }
          }
        });
      }
    });
  }

  preventEnterIfInvalid(event: KeyboardEvent, form: FormGroup): void {
    if (event.key === 'Enter') {
      const target = event.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'textarea') return;
      
      const cant = form.get('cantidad')?.value;
      if (form.invalid || !cant || Number(cant) === 0) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  }

  // ==================== Carga Masiva desde Excel ====================
  abrirImportacionExcel(): void {
    const dialogRef = this.dialog.open(PopupImportIngresosComponent, {
      maxWidth: '96vw',
      maxHeight: '92vh',
      panelClass: 'custom-dialog-container',
      disableClose: true,
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '150ms'
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        this.loadHistorial();
        this.loadCatalogos();
      }
    });
  }

  // ==================== Registrar Ingreso ====================
  registrarIngreso(): void {
    if (this.ingresoForm.invalid) {
      this.ingresoForm.markAllAsTouched();
      return;
    }
    const val = this.ingresoForm.value;
    const insumoNombre = typeof val.insumoObj === 'object' ? val.insumoObj?.codigoFabrica : (val.insumoObj || 'Insumo');
    const ubiNombre = typeof val.ubicacionObj === 'object' ? val.ubicacionObj?.nombre : (val.ubicacionObj || 'Destino');
    const precio = val.precioUnitario || 0;
    const totalInversion = (val.cantidad || 0) * precio;

    this.confirmacionService.confirmar({
      titulo: 'Confirmar Registro de Ingreso',
      subtitulo: 'Se registrará una entrada en el Kardex y aumentará el stock físico.',
      icono: 'inventory',
      tipo: 'ingreso',
      metricas: [
        { label: 'Insumo', value: insumoNombre, colorClass: 'text-slate-900' },
        { label: 'Cantidad', value: `${val.cantidad} un.`, colorClass: 'text-emerald-700' },
        { label: 'Inversión Est.', value: `$ ${totalInversion.toLocaleString('es-CO')} COP`, colorClass: 'text-emerald-800' }
      ],
      items: [{
        codigo: insumoNombre,
        descripcion: typeof val.insumoObj === 'object' ? val.insumoObj?.descripcion : null,
        cantidad: val.cantidad,
        ubicacion: ubiNombre,
        precioUnitario: val.precioUnitario
      }],
      mensajeAdvertencia: 'Esta acción incrementará el stock disponible en la ubicación seleccionada.',
      btnConfirmarTexto: 'Sí, registrar ingreso',
      btnCancelarTexto: 'Revisar'
    }).subscribe(confirmado => {
      if (confirmado) {
        const req: MovimientoRequest = {
          ...this.ingresoForm.value,
          usuarioRegistro: this.userService.currentUser?.email || this.userService.currentUser?.nombreCompleto || undefined,
        };
        this.movimientoService.registrarIngreso(req).subscribe({
          next: () => {
            this.snackBar.open('Ingreso registrado exitosamente', 'Cerrar', { duration: 3000 });
            this.ingresoForm.reset({ cantidad: 0 });
            this.limpiarInsumo('INGRESO');
            this.loadHistorial();
          },
          error: (err) => {
            const msg = err.message || err.error?.message || 'Error al registrar ingreso';
            this.confirmacionService.mostrarAdvertencia('Error al Registrar Ingreso', msg);
          }
        });
      }
    });
  }

  // ==================== Registrar Salida ====================
  registrarSalida(): void {
    if (this.salidaForm.invalid) {
      this.salidaForm.markAllAsTouched();
      return;
    }
    const val = this.salidaForm.value;
    const insumoNombre = typeof val.insumoObj === 'object' ? val.insumoObj?.codigoFabrica : (val.insumoObj || 'Insumo');
    const ubiNombre = typeof val.ubicacionObj === 'object' ? val.ubicacionObj?.nombre : (val.ubicacionObj || 'Origen');

    this.confirmacionService.confirmar({
      titulo: 'Confirmar Registro de Salida',
      subtitulo: 'Se registrará un egreso de inventario y se descontará del stock.',
      icono: 'outbox',
      tipo: 'salida',
      metricas: [
        { label: 'Insumo', value: insumoNombre, colorClass: 'text-slate-900' },
        { label: 'Cantidad', value: `${val.cantidad} un.`, colorClass: 'text-amber-700' },
        { label: 'Ubicación Origen', value: ubiNombre, colorClass: 'text-slate-800' }
      ],
      items: [{
        codigo: insumoNombre,
        descripcion: typeof val.insumoObj === 'object' ? val.insumoObj?.descripcion : null,
        cantidad: val.cantidad,
        ubicacion: ubiNombre
      }],
      mensajeAdvertencia: 'Esta acción descontará las unidades de la ubicación seleccionada de forma permanente.',
      btnConfirmarTexto: 'Sí, registrar salida',
      btnCancelarTexto: 'Revisar'
    }).subscribe(confirmado => {
      if (confirmado) {
        const req: MovimientoRequest = {
          ...this.salidaForm.value,
          usuarioRegistro: this.userService.currentUser?.email || this.userService.currentUser?.nombreCompleto || undefined,
        };
        this.movimientoService.registrarSalida(req).subscribe({
          next: () => {
            this.snackBar.open('Salida registrada exitosamente', 'Cerrar', { duration: 3000 });
            this.salidaForm.reset({ cantidad: 0 });
            this.limpiarInsumo('SALIDA');
            this.loadHistorial();
          },
          error: (err) => {
            const msg = err.message || err.error?.message || 'Error al registrar salida';
            this.confirmacionService.mostrarAdvertencia('Error al Registrar Salida', msg);
          }
        });
      }
    });
  }

  // ==================== Registrar Ajuste ====================
  registrarAjuste(): void {
    if (this.ajusteForm.invalid) {
      this.ajusteForm.markAllAsTouched();
      return;
    }
    const formValue = this.ajusteForm.value;
    const insumoNombre = typeof formValue.insumoObj === 'object' ? formValue.insumoObj?.codigoFabrica : (formValue.insumoObj || 'Insumo');

    this.confirmacionService.confirmar({
      titulo: 'Confirmar Ajuste / Reubicación',
      subtitulo: 'Se aplicará un ajuste físico sobre las existencias del insumo.',
      icono: 'tune',
      tipo: 'ajuste',
      metricas: [
        { label: 'Insumo', value: insumoNombre, colorClass: 'text-slate-900' },
        { label: 'Cantidad', value: `${formValue.cantidad} un.`, colorClass: 'text-slate-900' }
      ],
      mensajeAdvertencia: 'Verifique que la cantidad y ubicaciones correspondan con el conteo físico real.',
      btnConfirmarTexto: 'Sí, aplicar ajuste',
      btnCancelarTexto: 'Revisar'
    }).subscribe(confirmado => {
      if (confirmado) {
        const req: MovimientoRequest = {
          idInsumo: formValue.idInsumo,
          idUbicacion: formValue.idUbicacion,
          cantidad: formValue.cantidad,
          observacion: formValue.observacion,
        };
        if (formValue.idNuevaUbicacion) {
          req.idNuevaUbicacion = formValue.idNuevaUbicacion;
        }
        req.usuarioRegistro = this.userService.currentUser?.email || this.userService.currentUser?.nombreCompleto || undefined;
        
        this.movimientoService.registrarAjuste(req).subscribe({
          next: () => {
            this.snackBar.open('Ajuste registrado exitosamente', 'Cerrar', { duration: 3000 });
            this.ajusteForm.reset({ cantidad: 0 });
            this.limpiarInsumo('AJUSTE');
            this.currentInsumoUbicacion = '';
            this.loadHistorial();
          },
          error: (err) => {
            const msg = err.message || err.error?.message || 'Error al registrar ajuste';
            this.confirmacionService.mostrarAdvertencia('Error al Registrar Ajuste', msg);
          }
        });
      }
    });
  }
}

