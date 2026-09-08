import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ReporteService } from '@app/core/services/reporte.service';
import { InsumoService } from '@app/core/services/insumo.service';
import { ExcelExportService, ExcelColumn } from '@app/core/services/excel-export.service';
import { InsumoDto, MovimientosPeriodoDto } from '@app/core/models';

@Component({
  selector: 'app-reporte-movimientos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSnackBarModule, MatDatepickerModule, MatNativeDateModule,
    MatAutocompleteModule, MatCardModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  templateUrl: './reporte-movimientos.component.html',
  styleUrls: ['./reporte-movimientos.component.scss']
})
export class ReporteMovimientosComponent implements OnInit {
  insumos: InsumoDto[] = [];
  movInsumoCtrl = new FormControl<InsumoDto | string | null>('');
  filteredInsumos$!: Observable<InsumoDto[]>;

  desde: Date | null = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  hasta: Date | null = new Date();

  movData?: MovimientosPeriodoDto;
  columns = ['fecha', 'tipoMovimiento', 'codigoFabrica', 'cantidad', 'ubicacion', 'usuarioRegistro', 'observacion'];
  loading = false;

  constructor(
    private reporteService: ReporteService,
    private insumoService: InsumoService,
    private excelService: ExcelExportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.filteredInsumos$ = this.movInsumoCtrl.valueChanges.pipe(
      startWith(''),
      map(val => this._filterInsumos(val))
    );

    this.insumoService.getAllFiltered({ page: 1, pageSize: 10000 }).subscribe({
      next: res => {
        this.insumos = res.items || [];
        this.movInsumoCtrl.updateValueAndValidity();
      }
    });

    this.consultar();
  }

  private _filterInsumos(value: string | InsumoDto | null): InsumoDto[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase().trim() : (value?.codigoFabrica?.toLowerCase() || '');
    if (!filterValue) return this.insumos.slice(0, 50);
    return this.insumos.filter(i =>
      (i.codigoFabrica && i.codigoFabrica.toLowerCase().includes(filterValue)) ||
      (i.descripcion && i.descripcion.toLowerCase().includes(filterValue))
    ).slice(0, 50);
  }

  displayInsumo(insumo: InsumoDto | null): string {
    return insumo ? `${insumo.codigoFabrica} - ${insumo.descripcion || ''}` : '';
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

  consultar(): void {
    if (!this.desde || !this.hasta) {
      this.snackBar.open('Por favor especifica las fechas Desde y Hasta', 'Cerrar', { duration: 4000 });
      return;
    }

    const selected = this.movInsumoCtrl.value;
    const insumoId = typeof selected === 'object' && selected ? selected.id : undefined;

    this.loading = true;
    this.movData = undefined;
    this.reporteService.getMovimientosPeriodo(
      this.formatDate(this.desde)!,
      this.formatDate(this.hasta)!,
      insumoId
    ).subscribe({
      next: data => {
        this.movData = data;
        this.loading = false;
        if (!data.movimientos || data.movimientos.length === 0) {
          this.snackBar.open('No se encontraron movimientos en el período seleccionado', 'Cerrar', { duration: 4000 });
        }
      },
      error: err => {
        this.loading = false;
        this.snackBar.open('Error: ' + (err.message || 'Error al consultar movimientos'), 'Cerrar', { duration: 5000 });
      }
    });
  }

  exportarExcel(): void {
    if (!this.movData || !this.movData.movimientos || this.movData.movimientos.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const selected = this.movInsumoCtrl.value as InsumoDto;
    const insumoFilter = typeof selected === 'object' && selected ? `${selected.codigoFabrica} - ${selected.descripcion}` : 'Todos los Insumos';

    const columns: ExcelColumn[] = [
      { header: 'Fecha', field: 'fecha', type: 'date', width: 100 },
      { header: 'Tipo Movimiento', field: 'tipoMovimiento', type: 'string', width: 130 },
      { header: 'Código Fábrica', field: 'codigoFabrica', type: 'string', width: 140 },
      { header: 'Cantidad', field: 'cantidad', type: 'number', width: 90 },
      { header: 'Ubicación', field: 'ubicacion', type: 'string', width: 150 },
      { header: 'Usuario Registro', field: 'usuarioRegistro', type: 'string', width: 140 },
      { header: 'Observación', field: 'observacion', type: 'string', width: 220 },
    ];

    const filters = [
      { label: 'Período Consultado', value: `${this.formatDate(this.desde)} a ${this.formatDate(this.hasta)}` },
      { label: 'Filtro por Insumo', value: insumoFilter },
      { label: 'Total Movimientos Registrados', value: String(this.movData.movimientos.length) },
      { label: 'Total Ingresos (Unidades)', value: String(this.movData.totalIngresos) },
      { label: 'Total Salidas (Unidades)', value: String(this.movData.totalSalidas) },
      { label: 'Total Ajustes (Unidades)', value: String(this.movData.totalAjustes) },
    ];

    this.excelService.exportToExcel({
      title: 'REPORTE CONSOLIDADO DE MOVIMIENTOS POR PERÍODO',
      subtitle: `Movimientos registrados entre ${this.formatDate(this.desde)} y ${this.formatDate(this.hasta)}`,
      fileName: `Movimientos_${this.formatDate(this.desde)}_al_${this.formatDate(this.hasta)}`,
      filters,
      columns,
      data: this.movData.movimientos,
      totalFields: ['cantidad'],
      totalLabel: 'SUMA TOTAL DE CANTIDADES'
    });

    this.snackBar.open('Reporte exportado exitosamente a Excel', 'Cerrar', { duration: 4000 });
  }
}
