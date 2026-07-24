import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { InsumoService } from '@app/core/services/insumo.service';
import { InsumoDto, InsumoFilter, PagedResult } from '@app/core/models';
import { ParametricFilterComponent } from '@shared/components/parametric-filter/parametric-filter.component';
import { INSUMO_FILTER_CONFIG } from '@shared/config/insumo-filter.config';
import { PopupInsumosComponent } from 'app/modules/admin/apps/inventario/popup/popupInsumos/popup-insumos.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { UserService } from '@app/core/user/user.service';

@Component({
  selector: 'app-insumos',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatInputModule,
    MatCardModule, MatTooltipModule, MatSnackBarModule,
    ParametricFilterComponent,
  ],
  templateUrl: './insumos.component.html',
  styleUrls: ['./insumos.component.scss']
})
export class InsumosComponent implements OnInit, OnDestroy {
  displayedColumns = ['codigoFabrica', 'categoriaNombre', 'descripcion', 'empaquetamientoNombre', 'ubicacionNombre', 'valorMedida', 'precioReferencia', 'cantidad', 'acciones'];
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
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fuseConfirmation: FuseConfirmationService,
    private userService: UserService,
  ) {}

  get userRole(): string {
    return this.userService.currentUser?.role || '';
  }

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
    if (filter['valorMedidaRange']) {
      const range = filter['valorMedidaRange'] as { min?: string; max?: string };
      if (range.min) f.valorMedidaMin = parseFloat(range.min);
      if (range.max) f.valorMedidaMax = parseFloat(range.max);
    }
    if (filter['textSearch'] && typeof filter['textSearch'] === 'string') {
      f.textSearch = filter['textSearch'];
    }
    this.currentFilter = f;
    this.page = 1;
    this.loadData();
  }

  onPageChange(event: PageEvent): void {
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
    const popup = this.dialog.open(PopupInsumosComponent, {
      width: '500px',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms',
      data: { estado: 1, data: null }
    });
    popup.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Insumo creado exitosamente', 'Cerrar', { duration: 3000 });
        this.loadData();
      }
    });
  }

  editarInsumo(insumo: InsumoDto): void {
    const popup = this.dialog.open(PopupInsumosComponent, {
      width: '500px',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms',
      data: { estado: 2, data: insumo }
    });
    popup.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Insumo actualizado exitosamente', 'Cerrar', { duration: 3000 });
        this.loadData();
      }
    });
  }

  eliminarInsumo(insumo: InsumoDto): void {
    const dialog = this.fuseConfirmation.open({
      title: 'Eliminar insumo',
      message: `¿Está seguro de eliminar "${insumo.codigoFabrica}" (ID: ${insumo.id})? Esta acción no se puede deshacer.`,
      icon: { name: 'heroicons_outline:trash', color: 'warn' },
      actions: { confirm: { label: 'Sí, eliminar', color: 'warn' }, cancel: { label: 'Cancelar' } },
    });
    dialog.afterClosed().subscribe(result => {
      if (result === 'confirmed') {
        this.insumoService.delete(insumo.id).subscribe({
          next: () => {
            this.snackBar.open(`Insumo "${insumo.codigoFabrica}" eliminado`, 'Cerrar', { duration: 3000 });
            this.loadData();
          },
          error: (err) => this.snackBar.open('Error: ' + (err.message || 'Error al eliminar'), 'Cerrar', { duration: 5000 })
        });
      }
    });
  }
}
