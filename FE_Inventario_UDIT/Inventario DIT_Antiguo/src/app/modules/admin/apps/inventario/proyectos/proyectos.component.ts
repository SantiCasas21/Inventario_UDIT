import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ProyectoDto } from '@app/core/models';
import { ProyectoService } from '@app/core/services/proyecto.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupProyectosComponent } from '../popup/popupProyectos/popup-proyectos.component';
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
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule],
  templateUrl: './proyectos.component.html',
  styleUrl: './proyectos.component.scss'
})
export class ProyectosComponent implements OnInit, AfterViewInit {
  userService = inject(UserService);
  confirmacionService = inject(ConfirmacionService);
  snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['editar', 'id', 'nombre', 'descripcion', 'idestado', 'fechacreacion'];
  dataSource = new MatTableDataSource<ProyectoDto>();
  error: string | null = null;

  constructor(private service: ProyectoService, private dialog: MatDialog) { }

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
    this.mostrarProyectos();
  }

  mostrarProyectos() {
    this.error = null;
    this.service.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      },
      error: (err) => {
        this.error = 'Error al cargar datos: ' + (err.message || 'Error de conexión');
        console.error('Error loading proyectos', err);
      }
    });
  }

  abrirPopup(data: any, estado: any) {
    var _popup = this.dialog.open(PopupProyectosComponent, {
      width: '100%',
      maxWidth: '520px',
      panelClass: 'responsive-dialog-panel',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms',
      data: { data, estado }
    });
    _popup.afterClosed().subscribe(() => {
      this.mostrarProyectos();
    });
  }

  eliminarRegistro(row: any) {
    const nombre = row.nombre || `ID ${row.id}`;
    this.confirmacionService.confirmarEliminacion('Proyecto', nombre).subscribe(confirmado => {
      if (confirmado) {
        this.service.delete(row.id).subscribe({
          next: () => {
            this.snackBar.open('Proyecto eliminado exitosamente', 'Cerrar', { duration: 3000 });
            this.ngOnInit();
          },
          error: (err: any) => {
            const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'No se puede eliminar este Proyecto porque está asociado a movimientos en el sistema.');
            this.confirmacionService.mostrarAdvertencia('No es posible eliminar el proyecto', msg, `Proyecto: "${nombre}"`);
          }
        });
      }
    });
  }
}
