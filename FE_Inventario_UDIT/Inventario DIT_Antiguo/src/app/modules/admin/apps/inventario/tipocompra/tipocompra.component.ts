import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { TipoCompra } from '../../../../../../interfaces/tipocompra';
import { TipocompraService } from '../../../../../../@fuse/services/inventario/tipocompra/tipocompra.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupTipoCompraComponent } from '../popup/popupTipoCompra/popup-tipo-compra.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-tipocompra',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './tipocompra.component.html',
  styleUrl: './tipocompra.component.scss'
})
export class TipocompraComponent implements AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'nombre'];
  dataSource = new MatTableDataSource<TipoCompra>();
  datoscompletos:any;

  constructor(private service:TipocompraService, private dialog:MatDialog) { }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.mostrarTipoCompra();
  }

  async mostrarTipoCompra(){

    try
    {
      //this.dataSource.data  = await this.service.listarLamparas();
      this.datoscompletos = await this.service.listarTipoCompra();
      this.dataSource.data = this.datoscompletos;
      this.dataSource.paginator = this.paginator;
    }
    catch(err)
    {
      //crear popup de conexion
    }
  }

  abrirPopup(data:any, estado:any){
    var _popup = this.dialog.open(PopupTipoCompraComponent,{
      width:'30%',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data:{data, estado}
    })
    _popup.afterClosed().subscribe(item => {
      this.mostrarTipoCompra();
    })
  }
}