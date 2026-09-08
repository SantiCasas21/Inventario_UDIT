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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ReporteService } from '@app/core/services/reporte.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { ExcelExportService, ExcelColumn } from '@app/core/services/excel-export.service';
import { ResumenProyectoDto, ProyectoDto } from '@app/core/models';

@Component({
  selector: 'app-reporte-proyectos',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterModule,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatFormFieldModule, MatSnackBarModule, MatAutocompleteModule,
    MatCardModule, MatTooltipModule, MatProgressSpinnerModule
  ],
  templateUrl: './reporte-proyectos.component.html',
  styleUrls: ['./reporte-proyectos.component.scss']
})
export class ReporteProyectosComponent implements OnInit {
  proyectos: ProyectoDto[] = [];
  proyCtrl = new FormControl<ProyectoDto | string | null>('');
  filteredProyectos$!: Observable<ProyectoDto[]>;

  proyData: ResumenProyectoDto[] = [];
  loading = false;

  // Métricas
  totalProyectos = 0;
  totalInsumosDistintos = 0;
  totalUnidadesRetiradas = 0;
  totalCostoInvertido = 0;

  constructor(
    private reporteService: ReporteService,
    private catalogoService: CatalogoService,
    private excelService: ExcelExportService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.filteredProyectos$ = this.proyCtrl.valueChanges.pipe(
      startWith(''),
      map(val => this._filterProyectos(val))
    );

    this.catalogoService.getAll('proyecto').subscribe({
      next: r => {
        this.proyectos = r as unknown as ProyectoDto[];
        this.proyCtrl.updateValueAndValidity();
      }
    });

    this.consultar();
  }

  private _filterProyectos(value: string | ProyectoDto | null): ProyectoDto[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase().trim() : (value?.nombre?.toLowerCase() || '');
    if (!filterValue) return this.proyectos;
    return this.proyectos.filter(p => p.nombre && p.nombre.toLowerCase().includes(filterValue));
  }

  displayProyecto(proyecto: ProyectoDto | null): string {
    return proyecto ? proyecto.nombre : '';
  }

  consultar(): void {
    const selected = this.proyCtrl.value;
    const proyectoId = typeof selected === 'object' && selected ? selected.id : undefined;

    this.loading = true;
    this.proyData = [];
    this.reporteService.getResumenProyecto(proyectoId).subscribe({
      next: data => {
        this.proyData = data || [];
        this.loading = false;
        this.calcularMetricas();
        if (this.proyData.length === 0) {
          this.snackBar.open('No se encontraron registros de salidas para el proyecto seleccionado', 'Cerrar', { duration: 4000 });
        }
      },
      error: err => {
        this.loading = false;
        this.snackBar.open('Error: ' + (err.message || 'Error al consultar proyecto'), 'Cerrar', { duration: 5000 });
      }
    });
  }

  private calcularMetricas(): void {
    this.totalProyectos = this.proyData.length;
    let totalInsumos = 0;
    let totalUds = 0;
    let totalCosto = 0;

    this.proyData.forEach(p => {
      totalInsumos += (p.insumos || []).length;
      totalUds += p.totalUnidadesRetiradas || (p.insumos || []).reduce((acc, i) => acc + i.cantidadRetirada, 0);
      totalCosto += p.costoTotalProyecto || (p.insumos || []).reduce((acc, i) => acc + (i.costoTotal || 0), 0);
    });

    this.totalInsumosDistintos = totalInsumos;
    this.totalUnidadesRetiradas = totalUds;
    this.totalCostoInvertido = totalCosto;
  }

  exportarExcel(): void {
    if (this.proyData.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const selected = this.proyCtrl.value as ProyectoDto;
    const proyNombre = typeof selected === 'object' && selected ? selected.nombre : 'Todos los Proyectos';

    // Aplanar los datos para tabla tabular de Excel
    const flatRows: any[] = [];
    this.proyData.forEach(p => {
      (p.insumos || []).forEach(i => {
        flatRows.push({
          proyecto: p.proyectoNombre,
          estado: p.estadoNombre || 'Activo',
          codigoFabrica: i.codigoFabrica,
          descripcion: i.descripcion || '-',
          cantidadRetirada: i.cantidadRetirada,
          precioUnitario: i.precioUnitarioPromedio || 0,
          costoTotal: i.costoTotal || 0
        });
      });
    });

    const columns: ExcelColumn[] = [
      { header: 'Proyecto Destino', field: 'proyecto', type: 'string', width: 220 },
      { header: 'Estado', field: 'estado', type: 'string', width: 130 },
      { header: 'Código Insumo', field: 'codigoFabrica', type: 'string', width: 140 },
      { header: 'Descripción Insumo', field: 'descripcion', type: 'string', width: 260 },
      { header: 'Cantidad Retirada', field: 'cantidadRetirada', type: 'number', width: 130 },
      { header: 'Precio Unit. Promedio ($)', field: 'precioUnitario', type: 'currency', width: 160 },
      { header: 'Costo Total ($)', field: 'costoTotal', type: 'currency', width: 160 },
    ];

    const filters = [
      { label: 'Proyecto Consultado', value: proyNombre },
      { label: 'Total Proyectos con Movimientos', value: String(this.totalProyectos) },
      { label: 'Total Registros de Insumo', value: String(flatRows.length) },
      { label: 'Total Unidades Despachadas', value: String(this.totalUnidadesRetiradas) },
      { label: 'Total Inversión Económica', value: '$ ' + this.totalCostoInvertido.toLocaleString('es-CO') + ' COP' },
    ];

    this.excelService.exportToExcel({
      title: 'REPORTE DE ASIGNACIÓN Y CONSUMO ECONÓMICO POR PROYECTO',
      subtitle: `Resumen de insumos retirados y valor económico para: ${proyNombre}`,
      fileName: `Consumo_Economico_Proyecto_${proyNombre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}`,
      filters,
      columns,
      data: flatRows,
      totalFields: ['cantidadRetirada', 'costoTotal'],
      totalLabel: 'TOTALES'
    });

    this.snackBar.open('Reporte exportado exitosamente a Excel', 'Cerrar', { duration: 4000 });
  }
}
