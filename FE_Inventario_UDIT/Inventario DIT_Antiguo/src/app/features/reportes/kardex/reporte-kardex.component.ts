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
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, startWith, map } from 'rxjs/operators';
import { ReporteService } from '@app/core/services/reporte.service';
import { InsumoService } from '@app/core/services/insumo.service';
import { ExcelExportService, ExcelColumn } from '@app/core/services/excel-export.service';
import { InsumoDto, KardexDetalladoDto } from '@app/core/models';
import { ReportesNavComponent } from '../shared/reportes-nav.component';

import { UserService } from '@app/core/user/user.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-reporte-kardex',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSnackBarModule, MatDatepickerModule, MatNativeDateModule,
    MatAutocompleteModule, MatCardModule, MatTooltipModule, MatProgressSpinnerModule,
    ReportesNavComponent
  ],
  templateUrl: './reporte-kardex.component.html',
  styleUrls: ['./reporte-kardex.component.scss']
})
export class ReporteKardexComponent implements OnInit {
  userService = inject(UserService);

  get canExportar(): boolean {
    return this.userService.hasPermission('reportes.exportar');
  }

  kardexInsumoCtrl = new FormControl<InsumoDto | string | null>('');
  filteredInsumos$!: Observable<InsumoDto[]>;

  desde: Date | null = null;
  hasta: Date | null = null;

  kardexData: KardexDetalladoDto[] = [];
  columns = ['fecha', 'tipoMovimiento', 'cantidad', 'ubicacion', 'saldoAcumulado', 'proyecto', 'proveedor', 'usuarioRegistro', 'observacion'];
  loading = false;

  // Métricas
  totalIngresos = 0;
  totalSalidas = 0;
  saldoFinal = 0;

  constructor(
    private reporteService: ReporteService,
    private insumoService: InsumoService,
    private excelService: ExcelExportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.filteredInsumos$ = this.kardexInsumoCtrl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(val => {
        const text = typeof val === 'string' ? val.trim() : (val?.codigoFabrica || '');
        return this.insumoService.getAllFiltered({ textSearch: text, pageSize: 30 }).pipe(
          map(res => res.items || []),
          catchError(() => of([]))
        );
      })
    );
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
    const selected = this.kardexInsumoCtrl.value;
    const insumoId = typeof selected === 'object' && selected ? selected.id : null;

    if (insumoId) {
      this.ejecutarConsulta(insumoId);
      return;
    }

    if (typeof selected === 'string' && selected.trim()) {
      // Si el usuario escribió un código/descripción en texto sin seleccionar de la lista predictiva
      this.loading = true;
      this.insumoService.getAllFiltered({ textSearch: selected.trim(), pageSize: 5 }).subscribe({
        next: res => {
          const items = res.items || [];
          if (items.length > 0) {
            const exact = items.find(i => i.codigoFabrica.toLowerCase() === selected.trim().toLowerCase()) || items[0];
            this.kardexInsumoCtrl.setValue(exact, { emitEvent: false });
            this.ejecutarConsulta(exact.id);
          } else {
            this.loading = false;
            this.snackBar.open(`No se encontró ningún insumo con "${selected}"`, 'Cerrar', { duration: 4000 });
          }
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Error al buscar insumo', 'Cerrar', { duration: 4000 });
        }
      });
      return;
    }

    this.snackBar.open('Por favor escribe o selecciona un insumo de la lista', 'Cerrar', { duration: 4000 });
  }

  private ejecutarConsulta(insumoId: number): void {
    this.loading = true;
    this.kardexData = [];
    this.reporteService.getKardex(insumoId, this.formatDate(this.desde), this.formatDate(this.hasta))
      .subscribe({
        next: data => {
          this.kardexData = data || [];
          this.loading = false;
          this.calcularMetricas();
          if (this.kardexData.length === 0) {
            this.snackBar.open('No se encontraron movimientos para el insumo en el rango de fechas', 'Cerrar', { duration: 4000 });
          }
        },
        error: err => {
          this.loading = false;
          this.snackBar.open('Error: ' + (err.message || 'Error al consultar Kardex'), 'Cerrar', { duration: 5000 });
        }
      });
  }

  private calcularMetricas(): void {
    this.totalIngresos = this.kardexData
      .filter(m => m.tipoMovimiento?.toLowerCase().includes('ingreso'))
      .reduce((sum, m) => sum + m.cantidad, 0);

    this.totalSalidas = this.kardexData
      .filter(m => m.tipoMovimiento?.toLowerCase().includes('salida'))
      .reduce((sum, m) => sum + m.cantidad, 0);

    if (this.kardexData.length > 0) {
      this.saldoFinal = this.kardexData[this.kardexData.length - 1].saldoAcumulado;
    } else {
      this.saldoFinal = 0;
    }
  }

  exportarExcel(): void {
    if (this.kardexData.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const selected = this.kardexInsumoCtrl.value as InsumoDto;
    const insumoDesc = typeof selected === 'object' && selected ? `${selected.codigoFabrica} - ${selected.descripcion}` : 'Insumo';

    const columns: ExcelColumn[] = [
      { header: 'Fecha', field: 'fecha', type: 'date', width: 100 },
      { header: 'Tipo Movimiento', field: 'tipoMovimiento', type: 'string', width: 130 },
      { header: 'Cantidad', field: 'cantidad', type: 'number', width: 90 },
      { header: 'Saldo Acumulado', field: 'saldoAcumulado', type: 'number', width: 110 },
      { header: 'Ubicación', field: 'ubicacion', type: 'string', width: 150 },
      { header: 'Proyecto Asignado', field: 'proyecto', type: 'string', width: 160 },
      { header: 'Proveedor', field: 'proveedor', type: 'string', width: 160 },
      { header: 'Usuario Registro', field: 'usuarioRegistro', type: 'string', width: 130 },
      { header: 'Observación', field: 'observacion', type: 'string', width: 220 },
    ];

    const filters = [
      { label: 'Insumo Seleccionado', value: insumoDesc },
      { label: 'Fecha Desde', value: this.formatDate(this.desde) || 'Inicio de los tiempos' },
      { label: 'Fecha Hasta', value: this.formatDate(this.hasta) || 'Actualidad' },
      { label: 'Total Entradas Registradas', value: String(this.totalIngresos) },
      { label: 'Total Salidas Registradas', value: String(this.totalSalidas) },
      { label: 'Saldo Final en Kardex', value: String(this.saldoFinal) },
    ];

    this.excelService.exportToExcel({
      title: `KARDEX DETALLADO — ${selected?.codigoFabrica || 'INSUMO'}`,
      subtitle: `Trazabilidad completa de movimientos para: ${insumoDesc}`,
      fileName: `Kardex_${selected?.codigoFabrica || 'Insumo'}_${new Date().toISOString().slice(0, 10)}`,
      filters,
      columns,
      data: this.kardexData,
      totalFields: ['cantidad'],
      totalLabel: 'TOTAL MOVIMIENTOS'
    });

    this.snackBar.open('Reporte exportado exitosamente a Excel', 'Cerrar', { duration: 4000 });
  }
}
