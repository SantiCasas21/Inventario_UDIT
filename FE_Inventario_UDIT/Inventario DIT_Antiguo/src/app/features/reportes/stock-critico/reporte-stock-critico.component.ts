import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReporteService } from '@app/core/services/reporte.service';
import { ExcelExportService, ExcelColumn } from '@app/core/services/excel-export.service';
import { StockCriticoDto } from '@app/core/models';

@Component({
  selector: 'app-reporte-stock-critico',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSnackBarModule, MatCardModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  templateUrl: './reporte-stock-critico.component.html',
  styleUrls: ['./reporte-stock-critico.component.scss']
})
export class ReporteStockCriticoComponent implements OnInit {
  umbral = 10;
  stockData: StockCriticoDto[] = [];
  columns = ['codigoFabrica', 'descripcion', 'categoria', 'ubicacion', 'stockActual', 'umbral', 'estado'];
  loading = false;

  // Métricas
  totalAgotados = 0;
  totalBajoStock = 0;

  constructor(
    private reporteService: ReporteService,
    private excelService: ExcelExportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.consultar();
  }

  consultar(): void {
    if (this.umbral < 0) {
      this.snackBar.open('El umbral no puede ser negativo', 'Cerrar', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.stockData = [];
    this.reporteService.getStockCritico(this.umbral).subscribe({
      next: data => {
        this.stockData = data || [];
        this.loading = false;
        this.calcularMetricas();
        if (this.stockData.length === 0) {
          this.snackBar.open('¡Excelente! No hay insumos con stock crítico bajo este umbral', 'Cerrar', { duration: 4000 });
        }
      },
      error: err => {
        this.loading = false;
        this.snackBar.open('Error: ' + (err.message || 'Error al consultar stock crítico'), 'Cerrar', { duration: 5000 });
      }
    });
  }

  private calcularMetricas(): void {
    this.totalAgotados = this.stockData.filter(i => i.stockActual <= 0).length;
    this.totalBajoStock = this.stockData.filter(i => i.stockActual > 0 && i.stockActual <= this.umbral).length;
  }

  exportarExcel(): void {
    if (this.stockData.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const columns: ExcelColumn[] = [
      { header: 'Código Fábrica', field: 'codigoFabrica', type: 'string', width: 140 },
      { header: 'Descripción', field: 'descripcion', type: 'string', width: 220 },
      { header: 'Categoría', field: 'categoria', type: 'string', width: 160 },
      { header: 'Ubicación', field: 'ubicacion', type: 'string', width: 160 },
      { header: 'Stock Actual', field: 'stockActual', type: 'number', width: 110 },
      { header: 'Umbral Máximo', field: 'umbral', type: 'number', width: 110 },
    ];

    const filters = [
      { label: 'Umbral de Alerta Configurado', value: `< ${this.umbral} unidades` },
      { label: 'Total Insumos Agotados (Stock 0)', value: String(this.totalAgotados) },
      { label: 'Total Insumos en Nivel Mínimo', value: String(this.totalBajoStock) },
      { label: 'Total Insumos en Alerta', value: String(this.stockData.length) },
    ];

    this.excelService.exportToExcel({
      title: 'REPORTE DE STOCK CRÍTICO Y MÍNIMOS DE SEGURIDAD',
      subtitle: `Insumos con existencia igual o inferior al umbral de ${this.umbral} unidades`,
      fileName: `StockCritico_Umbral${this.umbral}_${new Date().toISOString().slice(0, 10)}`,
      filters,
      columns,
      data: this.stockData,
      totalFields: ['stockActual'],
      totalLabel: 'SUMA STOCK CRÍTICO'
    });

    this.snackBar.open('Reporte exportado exitosamente a Excel', 'Cerrar', { duration: 4000 });
  }
}
