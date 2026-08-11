import { UserService } from '@app/core/user/user.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InsumoService } from '@app/core/services/insumo.service';
import { AfterViewInit, Component, ViewChild, inject } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Insumos } from '../../../../../../interfaces/insumos';
import { InsumosService } from '../../../../../../@fuse/services/inventario/insumos/insumos.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupInsumosComponent } from '../popup/popupInsumos/popup-insumos.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-insumosPublico',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './insumosPublico.component.html',
  styleUrl: './insumosPublico.component.scss'
})
export class InsumosPublicoComponent implements AfterViewInit {
  userService = inject(UserService);
  fuseConfirmation = inject(FuseConfirmationService);
  snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['editar', 'id', 'idnombreinsumo', 'codfabrica', 'valor', 'idempaquetamiento', 'descripcion', 'idubicacion', 'cantidad'];
  dataSource = new MatTableDataSource<Insumos>();
  datoscompletos:any;
  listadoInsumos:any;

  constructor(private service:InsumosService, private newInsumoService: InsumoService, private dialog:MatDialog) { }

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
    this.mostrarInsumos();
  }

  async mostrarInsumos(){

    try
    {
      //this.dataSource.data  = await this.service.listarLamparas();
      this.datoscompletos = await this.service.listarInsumos();
      this.listadoInsumos = this.datoscompletos.listaInsumos;
      this.dataSource.data = this.listadoInsumos;
      this.dataSource.paginator = this.paginator;
    }
    catch(err)
    {
      //crear popup de conexion
    }
  }

  eliminarRegistro(row: any) {
    const dialog = this.fuseConfirmation.open({
      title: 'Eliminar registro',
      message: '\u00bfEst\u00e1 seguro de eliminar este registro? Esta acci\u00f3n no se puede deshacer.',
      icon: { name: 'heroicons_outline:trash', color: 'warn' },
      actions: { confirm: { label: 'S\u00ed, eliminar', color: 'warn' }, cancel: { label: 'Cancelar' } },
    });
    dialog.afterClosed().subscribe(result => {
      if (result === 'confirmed') {
        this.newInsumoService.delete(row.id).subscribe({
          next: () => {
            this.snackBar.open('Registro eliminado', 'Cerrar', { duration: 3000 });
            this.ngOnInit();
          },
          error: (err:any) => {
            const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'No se puede eliminar este registro porque est\u00e1 siendo utilizado en insumos o movimientos del sistema.');
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

