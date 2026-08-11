import { inject } from '@angular/core';
import { UserService } from '@app/core/user/user.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AfterViewInit, Component, ViewChild, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-unidad-medida',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule],
  templateUrl: './unidad-medida.component.html',
  styleUrl: './unidad-medida.component.scss'
})
export class UnidadMedidaComponent implements OnInit, AfterViewInit {
  userService = inject(UserService);
  fuseConfirmation = inject(FuseConfirmationService);
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

  mostrarUnidades(){
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
      width: '400px',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data: { data, estado, endpoint: 'unidad-medida' }
    });
    
    _popup.afterClosed().subscribe(() => {
      this.mostrarUnidades();
    });
  }

  eliminarRegistro(row: any) {
    const dialog = this.fuseConfirmation.open({
      title: 'Eliminar registro',
      message: '¿Está seguro de eliminar este registro? Esta acción no se puede deshacer.',
      icon: { name: 'heroicons_outline:trash', color: 'warn' },
      actions: { confirm: { label: 'Sí, eliminar', color: 'warn' }, cancel: { label: 'Cancelar' } },
    });
    dialog.afterClosed().subscribe(result => {
      if (result === 'confirmed') {
        this.service.delete(row.id).subscribe({
          next: () => {
            this.snackBar.open('Registro eliminado', 'Cerrar', { duration: 3000 });
            this.ngOnInit();
          },
          error: (err: any) => {
            const msg = err.message || 'No se puede eliminar este registro porque está siendo utilizado en insumos o movimientos del sistema.';
            this.fuseConfirmation.open({
              title: 'Error al eliminar',
              message: msg,
              icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
              actions: { confirm: { show: true, label: 'Entendido', color: 'primary' }, cancel: { show: false, label: 'Cancelar' } }
            });
          }
        });
      }
    });
  }
}
