import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
import { ReporteService } from '@app/core/services/reporte.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { InsumoService } from '@app/core/services/insumo.service';
import { InsumoDto, CatalogoDto, KardexDetalladoDto, StockCriticoDto, MovimientosPeriodoDto, ResumenProyectoDto, ProyectoDto } from '@app/core/models';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTabsModule, MatTableModule, MatButtonModule, MatIconModule, MatSelectModule, MatInputModule, MatFormFieldModule, MatSnackBarModule, MatDatepickerModule, MatNativeDateModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss']
})
export class ReportesComponent implements OnInit {
  insumos: InsumoDto[] = [];
  proyectos: ProyectoDto[] = [];

  // Kardex
  kardexInsumoId: number | null = null;
  kardexDesde = '';
  kardexHasta = '';
  kardexData: KardexDetalladoDto[] = [];
  kardexColumns = ['fecha', 'tipoMovimiento', 'cantidad', 'observacion', 'proveedor', 'proyecto', 'saldoAcumulado'];

  // Stock Crítico
  stockUmbral = 10;
  stockData: StockCriticoDto[] = [];
  stockColumns = ['codigoFabrica', 'descripcion', 'categoria', 'ubicacion', 'stockActual', 'umbral'];

  // Movimientos Periodo
  movDesde = '';
  movHasta = '';
  movInsumoId: number | null = null;
  movData?: MovimientosPeriodoDto;
  movColumns = ['fecha', 'tipoMovimiento', 'codigoFabrica', 'cantidad', 'precioUnitario'];

  // Proyecto
  proyProyectoId: number | null = null;
  proyData: ResumenProyectoDto[] = [];
  proyColumns = ['codigoFabrica', 'cantidadRetirada'];

  constructor(
    private reporteService: ReporteService,
    private insumoService: InsumoService,
    private catalogoService: CatalogoService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.insumoService.getAllFiltered({ page: 1, pageSize: 1000 }).subscribe(r => this.insumos = r.items);
    this.catalogoService.getAll('proyecto').subscribe(r => this.proyectos = r as unknown as ProyectoDto[]);
  }

  private formatDate(date: any): string | undefined {
    if (!date) return undefined;
    if (typeof date === 'string') return date;
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return undefined;
  }

  cargarKardex(): void {
    if (!this.kardexInsumoId) return;
    this.reporteService.getKardex(this.kardexInsumoId, this.formatDate(this.kardexDesde), this.formatDate(this.kardexHasta))
      .subscribe({ next: r => this.kardexData = r, error: e => this.snackBar.open('Error: ' + (e.message || 'Error'), 'Cerrar', { duration: 5000 }) });
  }

  cargarStockCritico(): void {
    this.reporteService.getStockCritico(this.stockUmbral)
      .subscribe({ next: r => this.stockData = r, error: e => this.snackBar.open('Error: ' + (e.message || 'Error'), 'Cerrar', { duration: 5000 }) });
  }

  cargarMovimientos(): void {
    this.reporteService.getMovimientosPeriodo(
      this.formatDate(this.movDesde), this.formatDate(this.movHasta), this.movInsumoId || undefined
    ).subscribe({ next: r => this.movData = r, error: e => this.snackBar.open('Error: ' + (e.message || 'Error'), 'Cerrar', { duration: 5000 }) });
  }

  cargarProyecto(): void {
    if (!this.proyProyectoId) return;
    this.reporteService.getResumenProyecto(this.proyProyectoId)
      .subscribe({ next: r => this.proyData = r, error: e => this.snackBar.open('Error: ' + (e.message || 'Error'), 'Cerrar', { duration: 5000 }) });
  }
}
