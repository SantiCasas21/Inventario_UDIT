import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { FilterColumnConfig, SelectOption } from '../parametric-filter.types';

@Component({
  selector: 'app-filter-column',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="filter-column">
      <div class="column-header">{{ config.label }}</div>

      <!-- Search within for multi-select -->
      <input
        *ngIf="config.searchable && config.type === 'multi-select'"
        class="column-search"
        type="text"
        [placeholder]="config.searchPlaceholder || 'Buscar...'"
        [(ngModel)]="searchText"
        (input)="filterOptions()"
      />

      <!-- Multi-select list -->
      <div *ngIf="config.type === 'multi-select'" class="column-options">
        <label
          *ngFor="let opt of filteredOptions"
          class="option-item"
          [class.selected]="isSelected(opt.value)">
          <input
            type="checkbox"
            [checked]="isSelected(opt.value)"
            (change)="toggleOption(opt)"
          />
          <span>{{ opt.label }}</span>
        </label>
        <div *ngIf="filteredOptions.length === 0" class="no-options">
          Sin opciones
        </div>
      </div>

      <!-- Range number -->
      <div *ngIf="config.type === 'range-number'" class="range-inputs">
        <input
          type="number"
          class="range-input"
          [placeholder]="'Min' + (config.unit ? ' (' + config.unit + ')' : '')"
          [(ngModel)]="rangeMin"
          (change)="onRangeChange()"
        />
        <span class="range-sep">–</span>
        <input
          type="number"
          class="range-input"
          [placeholder]="'Max' + (config.unit ? ' (' + config.unit + ')' : '')"
          [(ngModel)]="rangeMax"
          (change)="onRangeChange()"
        />
        <div class="range-buttons">
          <button class="range-btn" (click)="selectLessEq()" title="Menor o igual">≤</button>
          <button class="range-btn" (click)="selectGreaterEq()" title="Mayor o igual">≥</button>
        </div>
      </div>

      <!-- Range date -->
      <div *ngIf="config.type === 'range-date'" class="range-inputs">
        <input
          type="date"
          class="range-input"
          placeholder="Desde"
          [(ngModel)]="rangeMin"
          (change)="onRangeChange()"
        />
        <span class="range-sep">–</span>
        <input
          type="date"
          class="range-input"
          placeholder="Hasta"
          [(ngModel)]="rangeMax"
          (change)="onRangeChange()"
        />
      </div>

      <!-- Text search -->
      <div *ngIf="config.type === 'text-search'" class="text-search">
        <input
          type="text"
          class="text-input"
          [placeholder]="config.searchPlaceholder || 'Buscar...'"
          [(ngModel)]="searchText"
          (input)="onSearchChange()"
        />
      </div>

      <!-- Reset link -->
      <button class="reset-link" (click)="reset()">Reiniciar</button>
    </div>
  `,
  styles: [`
    .filter-column {
      min-width: 180px;
      max-width: 280px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .column-header {
      font-size: 13px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }
    .column-search, .text-input {
      width: 100%;
      padding: 4px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .column-options {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #eee;
      border-radius: 4px;
    }
    .option-item {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      font-size: 12px;
      cursor: pointer;
      margin: 0;
    }
    .option-item:hover, .option-item.selected {
      background: #F3E7CE;
    }
    .no-options {
      padding: 8px;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    .range-inputs {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
    }
    .range-input {
      width: 75px;
      padding: 4px 6px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
    }
    .range-sep {
      font-size: 12px;
      color: #999;
    }
    .range-buttons {
      display: flex;
      gap: 4px;
      margin-top: 4px;
    }
    .range-btn {
      padding: 2px 8px;
      border: 1px solid #ccc;
      border-radius: 3px;
      background: #f5f5f5;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    }
    .range-btn:hover {
      background: #e0e0e0;
    }
    .reset-link {
      background: none;
      border: none;
      color: #636F03;
      font-size: 11px;
      cursor: pointer;
      padding: 2px 0;
      text-align: left;
    }
    .reset-link:hover {
      text-decoration: underline;
    }
  `]
})
export class FilterColumnComponent implements OnInit, OnDestroy {
  @Input() config!: FilterColumnConfig;

  @Output() valueChange = new EventEmitter<{ key: string; value: unknown[] | { min?: string; max?: string } | string }>();

  searchText = '';
  selectedValues: (number | string)[] = [];
  rangeMin = '';
  rangeMax = '';
  allOptions: SelectOption[] = [];
  filteredOptions: SelectOption[] = [];

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    if (this.config.options) {
      this.allOptions = this.config.options;
      this.filteredOptions = [...this.allOptions];
    }
    if (this.config.options$) {
      this.config.options$.pipe(takeUntil(this.destroy$)).subscribe(opts => {
        this.allOptions = opts;
        this.filteredOptions = [...this.allOptions];
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Multi-select
  isSelected(value: number | string): boolean {
    return this.selectedValues.includes(value);
  }

  toggleOption(opt: SelectOption): void {
    const idx = this.selectedValues.indexOf(opt.value);
    if (idx >= 0) {
      this.selectedValues.splice(idx, 1);
    } else {
      this.selectedValues.push(opt.value);
    }
    this.emitMultiSelect();
  }

  filterOptions(): void {
    const q = this.searchText.toLowerCase();
    this.filteredOptions = this.allOptions.filter(o =>
      o.label.toLowerCase().includes(q)
    );
  }

  private emitMultiSelect(): void {
    this.valueChange.emit({ key: this.config.key, value: this.selectedValues });
  }

  // Range
  onRangeChange(): void {
    this.valueChange.emit({
      key: this.config.key,
      value: { min: this.rangeMin || undefined, max: this.rangeMax || undefined }
    });
  }

  selectLessEq(): void {
    if (this.rangeMax) {
      // Selecciona máximo = valor actual (para que sea ≤)
      this.valueChange.emit({
        key: this.config.key,
        value: { max: this.rangeMax }
      });
    }
  }

  selectGreaterEq(): void {
    if (this.rangeMin) {
      // Selecciona mínimo = valor actual (para que sea ≥)
      this.valueChange.emit({
        key: this.config.key,
        value: { min: this.rangeMin }
      });
    }
  }

  // Text search
  onSearchChange(): void {
    this.valueChange.emit({ key: this.config.key, value: this.searchText });
  }

  // Reset
  reset(): void {
    this.selectedValues = [];
    this.rangeMin = '';
    this.rangeMax = '';
    this.searchText = '';
    this.filteredOptions = [...this.allOptions];
    this.valueChange.emit({ key: this.config.key, value: [] });
  }
}
