import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService } from '@app/core/services/dashboard.service';
import { DashboardDto, IrregularidadDto } from '@app/core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
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

  private destroy$ = new Subject<void>();

  constructor(private dashboardService: DashboardService) {}

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
}
