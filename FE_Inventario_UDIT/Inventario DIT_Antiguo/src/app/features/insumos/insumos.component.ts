import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { InsumoService } from '@app/core/services/insumo.service';
import { InsumoDto, InsumoFilter, PagedResult } from '@app/core/models';
import { ParametricFilterComponent } from '@shared/components/parametric-filter/parametric-filter.component';
import { INSUMO_FILTER_CONFIG } from '@shared/config/insumo-filter.config';

@Component({
  selector: 'app-insumos',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatInputModule,
    ParametricFilterComponent,
  ],
  templateUrl: './insumos.component.html',
  styleUrls: ['./insumos.component.scss']
})
export class InsumosComponent implements OnInit, OnDestroy {
  displayedColumns = ['id', 'codigoFabrica', 'categoriaNombre', 'descripcion', 'empaquetamientoNombre', 'ubicacionNombre', 'precioReferencia', 'acciones'];
  data: InsumoDto[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 20;
  sortBy = 'codigoFabrica';
  sortDescending = false;
  loading = false;
  error: string | null = null;
  filterConfig = INSUMO_FILTER_CONFIG;
  currentFilter: InsumoFilter = { page: 1, pageSize: 20 };

  @ViewChild(MatPaginator) paginator?: MatPaginator;

  private destroy$ = new Subject<void>();

  constructor(
    private insumoService: InsumoService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;
    const filter = { ...this.currentFilter, page: this.page, pageSize: this.pageSize, sortBy: this.sortBy, sortDescending: this.sortDescending };

    this.insumoService.filter(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: PagedResult<InsumoDto>) => {
          this.data = result.items;
          this.totalCount = result.totalCount;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar insumos: ' + (err.message || 'Error de conexión');
          this.loading = false;
        }
      });
  }

  onFilterChange(filter: Record<string, unknown>): void {
    // Mapear los valores del filtro UI al DTO de filtro
    const f: InsumoFilter = { page: 1, pageSize: this.pageSize };

    if (filter['idsCategoria'] && Array.isArray(filter['idsCategoria']) && (filter['idsCategoria'] as number[]).length > 0) {
      f.idsCategoria = filter['idsCategoria'] as number[];
    }
    if (filter['idsEmpaquetamiento'] && Array.isArray(filter['idsEmpaquetamiento']) && (filter['idsEmpaquetamiento'] as number[]).length > 0) {
      f.idsEmpaquetamiento = filter['idsEmpaquetamiento'] as number[];
    }
    if (filter['idsUbicacion'] && Array.isArray(filter['idsUbicacion']) && (filter['idsUbicacion'] as number[]).length > 0) {
      f.idsUbicacion = filter['idsUbicacion'] as number[];
    }
    if (filter['precioRange']) {
      const range = filter['precioRange'] as { min?: string; max?: string };
      if (range.min) f.precioMin = parseFloat(range.min);
      if (range.max) f.precioMax = parseFloat(range.max);
    }
    if (filter['textSearch'] && typeof filter['textSearch'] === 'string') {
      f.textSearch = filter['textSearch'];
    }

    this.currentFilter = f;
    this.page = 1;
    this.loadData();
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadData();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortDescending = !this.sortDescending;
    } else {
      this.sortBy = column;
      this.sortDescending = false;
    }
    this.loadData();
  }

  crearInsumo(): void {
    // TODO: Abrir popup de creación (FASE 5)
    console.log('Abrir popup crear insumo');
  }

  editarInsumo(insumo: InsumoDto): void {
    // TODO: Abrir popup de edición (FASE 5)
    console.log('Abrir popup editar insumo', insumo.id);
  }

  eliminarInsumo(insumo: InsumoDto): void {
    // TODO: Confirmar y eliminar (FASE 5)
    console.log('Confirmar eliminar insumo', insumo.id);
  }
}
