import { AfterViewInit, Component, ViewChild } from '@angular/core';
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
  selector: 'app-insumos',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './insumos.component.html',
  styleUrl: './insumos.component.scss'
})
export class InsumosComponent implements AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'idnombreinsumo', 'codfabrica', 'valor', 'idempaquetamiento', 'descripcion', 'idubicacion', 'cantidad'];
  dataSource = new MatTableDataSource<Insumos>();
  datoscompletos:any;
  listadoInsumos:any;

  constructor(private service:InsumosService, private dialog:MatDialog) { 
    this.listadoInsumos = service.listarInsumos();
  }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;

  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
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

  abrirPopup(data:any, estado:any){
    const appRoot = document.querySelector('app-root');
    if (appRoot) {
      // Quitar aria-hidden antes de abrir el diálogo
      appRoot.removeAttribute('aria-hidden');
    }
    const _popup = this.dialog.open(PopupInsumosComponent, {
      width: '30%',
      data: { data, estado },
      autoFocus: true,
      disableClose: false, // Permitir cerrar el popup fácilmente
      panelClass: 'custom-dialog-container', // Clase personalizada si es necesario
    });
    _popup.afterClosed().subscribe(item => {
      this.mostrarInsumos();
    })
  }
}
