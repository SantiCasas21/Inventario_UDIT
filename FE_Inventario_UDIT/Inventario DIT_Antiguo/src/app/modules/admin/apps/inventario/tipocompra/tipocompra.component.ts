import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CatalogoDto } from '@app/core/models';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupTipoCompraComponent } from '../popup/popupTipoCompra/popup-tipo-compra.component';
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
  selector: 'app-tipocompra',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule],
  templateUrl: './tipocompra.component.html',
  styleUrl: './tipocompra.component.scss'
})
export class TipocompraComponent implements OnInit, AfterViewInit {
  userService = inject(UserService);
  confirmacionService = inject(ConfirmacionService);
  snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['editar', 'id', 'nombre'];
  dataSource = new MatTableDataSource<CatalogoDto>();
  endpoint = 'tipo-compra';
  error: string | null = null;

  constructor(private service: CatalogoService, private dialog: MatDialog) { }

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
    this.mostrarTipoCompra();
  }

  mostrarTipoCompra() {
    this.error = null;
    this.service.getAll(this.endpoint).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      },
      error: (err) => {
        this.error = 'Error al cargar datos: ' + (err.message || 'Error de conexi\u00f3n');
        console.error('Error loading', this.endpoint, err);
      }
    });
  }

  abrirPopup(data: any, estado: any) {
    var _popup = this.dialog.open(PopupTipoCompraComponent, {
      width: '100%',
      maxWidth: '520px',
      panelClass: 'responsive-dialog-panel',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms',
      data: { data, estado, endpoint: this.endpoint }
    });
    _popup.afterClosed().subscribe(() => {
      this.mostrarTipoCompra();
    });
  }

  eliminarRegistro(row: any) {
    const nombre = row.nombre || `ID ${row.id}`;
    this.confirmacionService.confirmarEliminacion('Tipo de Compra', nombre).subscribe(confirmado => {
      if (confirmado) {
        this.service.delete(this.endpoint, row.id).subscribe({
          next: () => {
            this.snackBar.open('Tipo de compra eliminado exitosamente', 'Cerrar', { duration: 3000 });
            this.ngOnInit();
          },
          error: (err: any) => {
            const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'No se puede eliminar este tipo de compra porque está siendo utilizado en insumos o movimientos del sistema.');
            this.confirmacionService.mostrarAdvertencia('No es posible eliminar el tipo de compra', msg, `Tipo de Compra: "${nombre}"`);
          }
        });
      }
    });
  }
}
