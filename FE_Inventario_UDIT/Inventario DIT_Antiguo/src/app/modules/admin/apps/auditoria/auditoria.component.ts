import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { AuditoriaService, AuditoriaDto } from '@app/core/services/auditoria.service';
import { PagedResult } from '@app/core/models';
import { TipoMovimientoBadgePipe } from '@app/shared/pipes/tipo-movimiento-badge.pipe';
import { TipoMovimientoCantidadPipe } from '@app/shared/pipes/tipo-movimiento-cantidad.pipe';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatPaginatorModule,
    MatInputModule, MatSelectModule, MatIconModule, MatButtonModule,
    MatCardModule, MatTooltipModule, ReactiveFormsModule,
    TipoMovimientoBadgePipe, TipoMovimientoCantidadPipe
  ],
  providers: [DatePipe],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.scss']
})
export class AuditoriaComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['fecha', 'usuario', 'modulo', 'accion', 'detalles'];
  dataSource = new MatTableDataSource<AuditoriaDto>();
  
  totalCount = 0;
  pageSize = 20;
  currentPage = 1;
  isLoading = false;
  error: string | null = null;
  
  filterForm: FormGroup;
  modulos = ['Insumos', 'Movimientos', 'Personal', 'Proyectos', 'Usuarios', 'Catálogos'];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private auditoriaService: AuditoriaService,
    private fb: FormBuilder,
    private datePipe: DatePipe
  ) {
    this.filterForm = this.fb.group({
      textSearch: [''],
      modulo: ['']
    });
  }

  ngOnInit(): void {
    this.loadLogs();
    
    this.filterForm.valueChanges.pipe(debounceTime(400)).subscribe(() => {
      this.currentPage = 1;
      if (this.paginator) this.paginator.pageIndex = 0;
      this.loadLogs();
    });
  }

  ngAfterViewInit() {
    // Initial pagination setup is handled by the template binding
  }

  loadLogs() {
    this.isLoading = true;
    this.error = null;
    const filters = this.filterForm.value;
    
    this.auditoriaService.getLogs(this.currentPage, this.pageSize, filters.textSearch, filters.modulo)
      .subscribe({
        next: (result: PagedResult<AuditoriaDto>) => {
          this.dataSource.data = result.items;
          this.totalCount = result.totalCount;
          this.isLoading = false;
        },
        error: (err) => {
          this.error = 'Error al cargar auditoría: ' + (err.message || '');
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadLogs();
  }

  formatDate(dateStr: string): string {
    return this.datePipe.transform(dateStr, 'dd/MM/yyyy') || dateStr;
  }
}
