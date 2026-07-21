import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { ParametricFilterConfig, AppliedFilter, FilterColumnConfig, SelectOption } from './parametric-filter.types';
import { FilterColumnComponent } from './filter-column/filter-column.component';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { CatalogoDto } from '@app/core/models';
import { map } from 'rxjs';

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

  private destroy$ = new Subject<void>();
  private currentFilter: Record<string, unknown> = {};

  constructor(private catalogoService: CatalogoService) {}

  ngOnInit(): void {
    this.smartColumns = this.config.columns.map(col => {
      if (col.optionsUrl && !col.options) {
        // Cargar opciones desde API de catálogo
        const colWithOptions = { ...col };
        colWithOptions.options$ = this.catalogoService.getAll(col.optionsUrl).pipe(
          map((catalogos: CatalogoDto[]) => catalogos.map(c => ({ label: c.nombre, value: c.id } as SelectOption)))
        );
        return colWithOptions;
      }
      return col;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onColumnChange(event: { key: string; value: unknown }): void {
    this.currentFilter[event.key] = event.value;

    // Actualizar breadcrumbs de filtros aplicados
    this.updateAppliedFilters();
  }

  private updateAppliedFilters(): void {
    this.appliedFilters = [];
    for (const key of Object.keys(this.currentFilter)) {
      const value = this.currentFilter[key];
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        continue;
      }
      const col = this.config.columns.find(c => c.key === key);
      const label = col?.label || key;
      let displayValue = '';
      if (Array.isArray(value)) {
        displayValue = value.map(v => String(v)).join(', ');
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
      this.updateAppliedFilters();
      this.applyFilters();
    }
  }

  applyFilters(): void {
    // Construir objeto de filtro limpio (sin valores vacíos)
    const cleanFilter: Record<string, unknown> = {};
    for (const key of Object.keys(this.currentFilter)) {
      const value = this.currentFilter[key];
      if (value !== undefined && value !== null && value !== '' &&
          !(Array.isArray(value) && value.length === 0) &&
          !(typeof value === 'object' && !(value as { min?: string; max?: string }).min && !(value as { min?: string; max?: string }).max)) {
        cleanFilter[key] = value;
      }
    }
    this.filterChange.emit(cleanFilter);
  }

  resetAll(): void {
    this.currentFilter = {};
    this.appliedFilters = [];
    this.filterChange.emit({});
  }
}
