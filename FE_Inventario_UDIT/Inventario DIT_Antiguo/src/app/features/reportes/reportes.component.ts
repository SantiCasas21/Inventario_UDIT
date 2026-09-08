import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ReporteService } from '@app/core/services/reporte.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { InsumoService } from '@app/core/services/insumo.service';
import { InsumoDto, KardexDetalladoDto, StockCriticoDto, MovimientosPeriodoDto, ResumenProyectoDto, ProyectoDto } from '@app/core/models';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatAutocompleteModule,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  insumos: InsumoDto[] = [];
  proyectos: ProyectoDto[] = [];

  // Kardex
  kardexInsumoCtrl = new FormControl<InsumoDto | string | null>('');
  filteredKardexInsumos$!: Observable<InsumoDto[]>;
  kardexDesde: Date | null = null;
  kardexHasta: Date | null = null;
  kardexData: KardexDetalladoDto[] = [];
  kardexColumns = ['fecha', 'tipoMovimiento', 'cantidad', 'ubicacion', 'saldoAcumulado', 'proyecto', 'proveedor', 'observacion'];
  loadingKardex = false;

  // Stock Crítico
  stockUmbral = 10;
  stockData: StockCriticoDto[] = [];
  stockColumns = ['codigoFabrica', 'descripcion', 'categoria', 'ubicacion', 'stockActual', 'umbral'];
  loadingStock = false;

  // Movimientos Periodo
  movInsumoCtrl = new FormControl<InsumoDto | string | null>('');
  filteredMovInsumos$!: Observable<InsumoDto[]>;
  movDesde: Date | null = null;
  movHasta: Date | null = null;
  movData?: MovimientosPeriodoDto;
  movColumns = ['fecha', 'tipoMovimiento', 'codigoFabrica', 'cantidad', 'ubicacion', 'usuarioRegistro', 'observacion'];
  loadingMov = false;

  // Proyecto
  proyCtrl = new FormControl<ProyectoDto | string | null>('');
  filteredProyectos$!: Observable<ProyectoDto[]>;
  proyData: ResumenProyectoDto[] = [];
  proyInsumosColumns = ['codigoFabrica', 'descripcion', 'cantidadRetirada'];
  loadingProy = false;

  constructor(
    private reporteService: ReporteService,
    private insumoService: InsumoService,
    private catalogoService: CatalogoService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    // Inicializar observables vacíos para evitar undefined antes de que responda la API
    this.filteredKardexInsumos$ = this.kardexInsumoCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterInsumos(value))
    );

    this.filteredMovInsumos$ = this.movInsumoCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterInsumos(value))
    );

    this.filteredProyectos$ = this.proyCtrl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterProyectos(value))
    );

    // Cargar catálogo completo de insumos (hasta 10.000)
    this.insumoService.getAllFiltered({ page: 1, pageSize: 10000 }).subscribe({
      next: (r) => {
        this.insumos = r.items || [];
        this.kardexInsumoCtrl.updateValueAndValidity();
        this.movInsumoCtrl.updateValueAndValidity();
      }
    });

    // Cargar proyectos
    this.catalogoService.getAll('proyecto').subscribe({
      next: (r) => {
        this.proyectos = r as unknown as ProyectoDto[];
        this.proyCtrl.updateValueAndValidity();
      }
    });
  }

  private _filterInsumos(value: string | InsumoDto | null): InsumoDto[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase().trim() : (value?.codigoFabrica?.toLowerCase() || '');
    if (!filterValue) return this.insumos.slice(0, 50);
    return this.insumos.filter(i =>
      (i.codigoFabrica && i.codigoFabrica.toLowerCase().includes(filterValue)) ||
      (i.descripcion && i.descripcion.toLowerCase().includes(filterValue))
    ).slice(0, 50);
  }

  private _filterProyectos(value: string | ProyectoDto | null): ProyectoDto[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase().trim() : (value?.nombre?.toLowerCase() || '');
    if (!filterValue) return this.proyectos;
    return this.proyectos.filter(p => p.nombre && p.nombre.toLowerCase().includes(filterValue));
  }

  displayInsumo(insumo: InsumoDto | null): string {
    return insumo ? `${insumo.codigoFabrica} - ${insumo.descripcion || ''}` : '';
  }

  displayProyecto(proyecto: ProyectoDto | null): string {
    return proyecto ? proyecto.nombre : '';
  }

  private formatDate(date: any): string | undefined {
    if (!date) return undefined;
    if (typeof date === 'string') {
      if (date.includes('T')) return date.split('T')[0];
      return date;
    }
    if (date instanceof Date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return undefined;
  }

  cargarKardex(): void {
    const selected = this.kardexInsumoCtrl.value;
    const insumoId = typeof selected === 'object' && selected ? selected.id : null;
    
    if (!insumoId) {
      this.snackBar.open('Por favor selecciona un insumo del buscador', 'Cerrar', { duration: 4000 });
      return;
    }

    this.loadingKardex = true;
    this.kardexData = [];
    this.reporteService.getKardex(insumoId, this.formatDate(this.kardexDesde), this.formatDate(this.kardexHasta))
      .subscribe({
        next: r => {
          this.kardexData = r || [];
          this.loadingKardex = false;
          if (this.kardexData.length === 0) {
            this.snackBar.open('No se encontraron movimientos para el insumo en el rango seleccionado', 'Cerrar', { duration: 4000 });
          }
        },
        error: e => {
          this.loadingKardex = false;
          this.snackBar.open('Error: ' + (e.message || 'Error al cargar kardex'), 'Cerrar', { duration: 5000 });
        }
      });
  }

  cargarStockCritico(): void {
    this.loadingStock = true;
    this.stockData = [];
    this.reporteService.getStockCritico(this.stockUmbral)
      .subscribe({
        next: r => {
          this.stockData = r || [];
          this.loadingStock = false;
        },
        error: e => {
          this.loadingStock = false;
          this.snackBar.open('Error: ' + (e.message || 'Error al consultar stock crítico'), 'Cerrar', { duration: 5000 });
        }
      });
  }

  cargarMovimientos(): void {
    if (!this.movDesde || !this.movHasta) {
      this.snackBar.open('Por favor especifica las fechas Desde y Hasta', 'Cerrar', { duration: 4000 });
      return;
    }

    const selected = this.movInsumoCtrl.value;
    const insumoId = typeof selected === 'object' && selected ? selected.id : undefined;

    this.loadingMov = true;
    this.movData = undefined;
    this.reporteService.getMovimientosPeriodo(
      this.formatDate(this.movDesde)!,
      this.formatDate(this.movHasta)!,
      insumoId
    ).subscribe({
      next: r => {
        this.movData = r;
        this.loadingMov = false;
        if (!r.movimientos || r.movimientos.length === 0) {
          this.snackBar.open('No se encontraron movimientos en el período especificado', 'Cerrar', { duration: 4000 });
        }
      },
      error: e => {
        this.loadingMov = false;
        this.snackBar.open('Error: ' + (e.message || 'Error al consultar movimientos'), 'Cerrar', { duration: 5000 });
      }
    });
  }

  cargarProyecto(): void {
    const selected = this.proyCtrl.value;
    const proyectoId = typeof selected === 'object' && selected ? selected.id : undefined;

    this.loadingProy = true;
    this.proyData = [];
    this.reporteService.getResumenProyecto(proyectoId)
      .subscribe({
        next: r => {
          this.proyData = r || [];
          this.loadingProy = false;
          if (this.proyData.length === 0) {
            this.snackBar.open('No se registraron salidas para el proyecto seleccionado', 'Cerrar', { duration: 4000 });
          }
        },
        error: e => {
          this.loadingProy = false;
          this.snackBar.open('Error: ' + (e.message || 'Error al consultar proyecto'), 'Cerrar', { duration: 5000 });
        }
      });
  }
}
