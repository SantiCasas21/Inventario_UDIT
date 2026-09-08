import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChildren, QueryList } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime, BehaviorSubject, Observable, map } from 'rxjs';
import { ParametricFilterConfig, AppliedFilter, FilterColumnConfig, SelectOption } from './parametric-filter.types';
import { FilterColumnComponent } from './filter-column/filter-column.component';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { CatalogoDto } from '@app/core/models';

@Component({
  selector: 'app-parametric-filter',
  standalone: true,
  imports: [CommonModule, FilterColumnComponent],
  templateUrl: './parametric-filter.component.html',
  styleUrls: ['./parametric-filter.component.scss']
})
export class ParametricFilterComponent implements OnInit, OnDestroy {
  @Input() config!: ParametricFilterConfig;
  @Input() resultCount: number | null = null;

  @Output() filterChange = new EventEmitter<Record<string, unknown>>();

  appliedFilters: AppliedFilter[] = [];
  smartFilter = true;
  loading = false;
  smartColumns: FilterColumnConfig[] = [];

  @ViewChildren(FilterColumnComponent) filterColumns!: QueryList<FilterColumnComponent>;

  private destroy$ = new Subject<void>();
  private currentFilter: Record<string, unknown> = {};
  private filterSubject = new Subject<Record<string, unknown>>();

  constructor(private catalogoService: CatalogoService) {}

  ngOnInit(): void {
    this.smartColumns = this.config.columns.map(col => {
      if (col.optionsUrl && !col.options) {
        // Cargar opciones desde API de catálogo en un BehaviorSubject
        // (permite refrescar las opciones si la columna depende de otra)
        const colWithOptions: FilterColumnConfig & { optionsSubject?: BehaviorSubject<SelectOption[]> } = { ...col };
        const subject = new BehaviorSubject<SelectOption[]>([]);
        colWithOptions.optionsSubject = subject;
        colWithOptions.options$ = subject.asObservable();
        this.cargarOpcionesPorCategoria(colWithOptions).subscribe(opts => subject.next(opts));
        return colWithOptions;
      }
      return col;
    });

    // Configurar filtrado reactivo con debounce
    this.filterSubject
      .pipe(
        debounceTime(this.config.debounceMs || 300),
        takeUntil(this.destroy$)
      )
      .subscribe(filter => {
        this.filterChange.emit(filter);
      });
  }

  /**
   * Carga las opciones de una columna. Si la columna depende de una categoría
   * (dependsOn='idsCategoria' + optionsByCategoriaUrl), filtra por las categorías
   * seleccionadas; si no hay categorías o no depende, carga todas.
   */
  private cargarOpcionesPorCategoria(col: FilterColumnConfig): Observable<SelectOption[]> {
    const toOptions = (catalogos: CatalogoDto[]) => {
      const seen = new Set<string | number>();
      const opts: SelectOption[] = [];
      for (const c of (catalogos || [])) {
        if (!c || !c.nombre) continue;
        const val = col.optionsValueField === 'nombre' ? c.nombre : c.id;
        if (val !== undefined && val !== null && !seen.has(val)) {
          seen.add(val);
          opts.push({ label: c.nombre, value: val });
        }
      }
      return opts;
    };

    if (col.dependsOn && col.optionsByCategoriaUrl) {
      const categoriaIds = (this.currentFilter[col.dependsOn] as number[]) || [];
      if (categoriaIds.length > 0) {
        return this.catalogoService.getByCategorias(col.optionsByCategoriaUrl, categoriaIds).pipe(map(toOptions));
      }
    }

    return this.catalogoService.getAll(col.optionsUrl!).pipe(map(toOptions));
  }

  /** Recarga las opciones de las columnas que dependen de la clave que cambió. */
  private reloadDependentColumns(changedKey: string): void {
    for (const col of this.smartColumns) {
      if (col.dependsOn === changedKey) {
        const subject = (col as any).optionsSubject as BehaviorSubject<SelectOption[]> | undefined;
        if (subject) {
          this.cargarOpcionesPorCategoria(col).subscribe(opts => subject.next(opts));
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onColumnChange(event: { key: string; value: unknown }): void {
    this.currentFilter[event.key] = event.value;

    // Si otra columna depende de esta (ej: empaquetamiento depende de categoría),
    // recargar sus opciones antes de emitir el filtro
    this.reloadDependentColumns(event.key);

    // Actualizar breadcrumbs de filtros aplicados
    this.updateAppliedFilters();

    // Si el filtrado inteligente está activo, emitir automáticamente con debounce
    if (this.smartFilter) {
      this.applyFiltersDebounced();
    }
  }

  private applyFiltersDebounced(): void {
    const cleanFilter = this.buildCleanFilter();
    this.filterSubject.next(cleanFilter);
  }

  private buildCleanFilter(): Record<string, unknown> {
    const clean: Record<string, unknown> = {};
    for (const key of Object.keys(this.currentFilter)) {
      const value = this.currentFilter[key];
      if (value !== undefined && value !== null && value !== '' &&
          !(Array.isArray(value) && value.length === 0) &&
          !(typeof value === 'object' && !Array.isArray(value) && !(value as Record<string, unknown>).min && !(value as Record<string, unknown>).max)) {
        clean[key] = value;
      }
    }
    return clean;
  }

  private updateAppliedFilters(): void {
    this.appliedFilters = [];
    for (const key of Object.keys(this.currentFilter)) {
      const value = this.currentFilter[key];
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        continue;
      }
      const col = this.smartColumns.find(c => c.key === key);
      const label = col?.label || key;
      let displayValue = '';
      if (Array.isArray(value)) {
        // Mapear los valores seleccionados a sus etiquetas si están en las opciones de la columna
        displayValue = value.map(v => {
          let label = String(v);
          if (col) {
            // Intentar buscar en options estáticas
            let opt = col.options?.find(o => o.value === v);
            if (!opt) {
              // Intentar buscar en optionsSubject (opciones dinámicas)
              const subject = (col as any).optionsSubject as BehaviorSubject<SelectOption[]> | undefined;
              if (subject) {
                opt = subject.getValue().find(o => o.value === v);
              }
            }
            if (opt) {
              label = opt.label;
            }
          }
          return label;
        }).join(', ');
      } else if (typeof value === 'object') {
        const range = value as { min?: string; max?: string };
        const parts: string[] = [];
        if (range.min) parts.push(`Min: ${range.min}`);
        if (range.max) parts.push(`Max: ${range.max}`);
        displayValue = parts.join(' - ');
      } else {
        displayValue = String(value);
      }
      this.appliedFilters.push({ key, label, value: displayValue, removable: true });
    }
  }

  removeFilter(filter: AppliedFilter): void {
    if (this.currentFilter[filter.key]) {
      delete this.currentFilter[filter.key];
      // Resetear la columna visual correspondiente
      if (this.filterColumns) {
        const matchingCol = this.filterColumns.find(c => c.config.key === filter.key);
        if (matchingCol) {
          matchingCol.reset(false);
        }
      }
      this.reloadDependentColumns(filter.key);
      this.updateAppliedFilters();
      this.applyFilters();
    }
  }

  applyFilters(): void {
    this.filterChange.emit(this.buildCleanFilter());
  }

  resetAll(): void {
    this.currentFilter = {};
    this.appliedFilters = [];
    if (this.filterColumns) {
      this.filterColumns.forEach(col => col.reset(false));
    }
    // Recargar todas las columnas dependientes para devolverlas al catálogo completo
    for (const col of this.smartColumns) {
      if (col.dependsOn) {
        const subject = (col as any).optionsSubject as BehaviorSubject<SelectOption[]> | undefined;
        if (subject) {
          this.cargarOpcionesPorCategoria(col).subscribe(opts => subject.next(opts));
        }
      }
    }
    this.filterChange.emit({});
  }
}
