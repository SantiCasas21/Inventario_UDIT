import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService } from '@app/core/services/dashboard.service';
import { UserService } from '@app/core/user/user.service';
import { DashboardDto, IrregularidadDto } from '@app/core/models';
import { PopupUnificarComponent } from 'app/modules/admin/apps/inventario/popup/popupUnificar/popup-unificar.component';
import { TipoMovimientoBadgePipe } from '@app/shared/pipes/tipo-movimiento-badge.pipe';
import { TipoMovimientoCantidadPipe } from '@app/shared/pipes/tipo-movimiento-cantidad.pipe';
import { CategoriaBadgePipe } from '@app/shared/pipes/categoria-badge.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule, MatDialogModule, TipoMovimientoBadgePipe, TipoMovimientoCantidadPipe, CategoriaBadgePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboard?: DashboardDto;
  loading = true;
  error: string | null = null;
  severityFilter = 'todas';
  filteredIrregularidades: IrregularidadDto[] = [];
  stockPage = 0;
  stockPageSize = 5;
  /** Índice de la irregularidad expandida (null si ninguna) */
  expandedIndex: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private dashboardService: DashboardService,
    private userService: UserService,
    private dialog: MatDialog
  ) {}

  get canUnificar(): boolean {
    return this.userService.hasPermission('insumos.unificar');
  }

  ngOnInit(): void {
    this.loadDashboard();
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get stockPages(): number {
    if (!this.dashboard?.stockBajo?.length) return 0;
    return Math.ceil(this.dashboard.stockBajo.length / this.stockPageSize);
  }

  get stockPageItems() {
    if (!this.dashboard?.stockBajo) return [];
    const start = this.stockPage * this.stockPageSize;
    return this.dashboard.stockBajo.slice(start, start + this.stockPageSize);
  }

  prevStockPage(): void {
    if (this.stockPage > 0) this.stockPage--;
  }

  nextStockPage(): void {
    if (this.stockPage < this.stockPages - 1) this.stockPage++;
  }

  loadDashboard(): void {
    this.loading = true;
    this.error = null;
    this.stockPage = 0;
    this.dashboardService.getDashboard()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.dashboard = data;
          this.filteredIrregularidades = data.irregularidades || [];
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar el dashboard: ' + (err.message || 'Error de conexión');
          this.loading = false;
        }
      });
  }

  filterSeverity(severidad: string): void {
    this.severityFilter = severidad;
    if (severidad === 'todas') {
      this.filteredIrregularidades = this.dashboard?.irregularidades || [];
    } else {
      this.filteredIrregularidades = (this.dashboard?.irregularidades || []).filter(
        i => i.severidad === severidad
      );
    }
  }

  /** Expande/colapsa el detalle de una irregularidad */
  toggleExpand(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  abrirUnificarModal(irr: IrregularidadDto): void {
    const dialogRef = this.dialog.open(PopupUnificarComponent, {
      width: '600px',
      data: { irr }
    });

    dialogRef.afterClosed().subscribe(success => {
      if (success) {
        // Recargar el dashboard después de unificar
        this.loadDashboard();
      }
    });
  }

  /** Retorna la clase CSS del badge de categoría según el nombre */
  getCategoriaBadgeClass(categoria: string): string {
    if (!categoria) return 'badge-categoria';
    const cat = categoria.toLowerCase();
    if (cat.includes('resisten')) return 'badge-cat-resistencia';
    if (cat.includes('condensa') || cat.includes('capaci')) return 'badge-cat-condensador';
    if (cat.includes('induct') || cat.includes('bobin')) return 'badge-cat-inductor';
    if (cat.includes('transist')) return 'badge-cat-transistor';
    if (cat.includes('diodo') || cat.includes('bater')) return 'badge-cat-diodo';
    if (cat.includes('cable') || cat.includes('alambre')) return 'badge-cat-cable';
    if (cat.includes('micro') || cat.includes('integrado')) return 'badge-cat-micro';
    if (cat.includes('herramienta')) return 'badge-cat-herramienta';
    
    // Hash category string to a consistent color class if it doesn't match known ones
    const colors = ['resistencia', 'condensador', 'inductor', 'transistor', 'diodo', 'cable', 'micro', 'herramienta'];
    let hash = 0;
    for (let i = 0; i < categoria.length; i++) hash = categoria.charCodeAt(i) + ((hash << 5) - hash);
    const index = Math.abs(hash) % colors.length;
    return `badge-categoria badge-cat-${colors[index]}`;
  }

  /** Retorna el conteo de irregularidades activas (no resueltas) */
  countActiveIrregularities(): number {
    if (!this.dashboard?.irregularidades) return 0;
    return this.dashboard.irregularidades.filter(i => i.severidad !== 'baja').length;
  }
}
