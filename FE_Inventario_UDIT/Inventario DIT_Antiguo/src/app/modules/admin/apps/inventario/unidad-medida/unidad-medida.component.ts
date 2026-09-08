import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { UnidadMedidaDto, UnidadMedidaService } from '@app/core/services/unidad-medida.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupUnidadMedidaComponent } from '../popup/popupUnidadMedida/popup-unidad-medida.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmacionService } from '@app/core/services/confirmacion.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '@app/core/user/user.service';

@Component({
  selector: 'app-unidad-medida',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule],
  templateUrl: './unidad-medida.component.html',
  styleUrl: './unidad-medida.component.scss'
})
export class UnidadMedidaComponent implements OnInit, AfterViewInit {
  userService = inject(UserService);
  confirmacionService = inject(ConfirmacionService);
  snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['id', 'nombre', 'idCategoria', 'acciones'];
  dataSource = new MatTableDataSource<UnidadMedidaDto>();
  error: string | null = null;

  constructor(private service: UnidadMedidaService, private dialog: MatDialog) { }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    if (this.userService.hasRole('admin') && !this.displayedColumns.includes('eliminar')) { this.displayedColumns.push('eliminar'); }
    this.mostrarUnidades();
  }

  mostrarUnidades() {
    this.error = null;
    this.service.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      },
      error: (err) => {
        this.error = 'Error al cargar datos: ' + (err.message || 'Error de conexi\u00f3n');
        console.error('Error loading unidades de medida', err);
      }
    });
  }

  abrirPopup(data: any, estado: any) {
    const _popup = this.dialog.open(PopupUnidadMedidaComponent, {
      width: '100%',
      maxWidth: '520px',
      panelClass: 'responsive-dialog-panel',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms',
      data: { data, estado, endpoint: 'unidad-medida' }
    });
    
    _popup.afterClosed().subscribe(() => {
      this.mostrarUnidades();
    });
  }

  eliminarRegistro(row: any) {
    const nombre = row.nombre || `ID ${row.id}`;
    this.confirmacionService.confirmarEliminacion('Unidad de Medida', nombre).subscribe(confirmado => {
      if (confirmado) {
        this.service.delete(row.id).subscribe({
          next: () => {
            this.snackBar.open('Unidad de medida eliminada exitosamente', 'Cerrar', { duration: 3000 });
            this.ngOnInit();
          },
          error: (err: any) => {
            const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'No se puede eliminar esta unidad de medida porque está siendo utilizada en insumos o movimientos del sistema.');
            this.confirmacionService.mostrarAdvertencia('No es posible eliminar la unidad de medida', msg, `Unidad de Medida: "${nombre}"`);
          }
        });
      }
    });
  }
}
