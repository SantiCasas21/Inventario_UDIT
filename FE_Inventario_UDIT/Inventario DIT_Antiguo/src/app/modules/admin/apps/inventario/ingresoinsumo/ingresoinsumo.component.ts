import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { IngresoInsumo } from '../../../../../../interfaces/ingresoinsumo';
import { IngresoinsumoService } from '../../../../../../@fuse/services/inventario/ingresoinsumo/ingresoinsumo.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupIngresoInsumoComponent } from '../popup/popupIngresoInsumo/popup-ingreso-insumo.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ingresoinsumo',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './ingresoinsumo.component.html',
  styleUrl: './ingresoinsumo.component.scss'
})
export class IngresoinsumoComponent implements AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'idproveedor','cantidad', 'idtipocompra','idproyecto', 'fecha', 'preciounit', 'restante','idinsumotabla'];
  dataSource = new MatTableDataSource<IngresoInsumo>();
  datoscompletos:any;

  constructor(private service:IngresoinsumoService, private dialog:MatDialog) { }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.mostrarIngresoInsumo();
  }

  async mostrarIngresoInsumo(){

    try
    {
      this.datoscompletos = await this.service.listarIngresoInsumo();
      this.dataSource.data = this.datoscompletos.listaIngresosInsumos;
      this.dataSource.paginator = this.paginator;

    }
    catch(err)
    {
      //crear popup de conexion
    }
  }

  abrirPopup(data:any, estado:any){
    var _popup = this.dialog.open(PopupIngresoInsumoComponent,{
      width:'30%',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data:{data, estado}
    })
    _popup.afterClosed().subscribe(item => {
      this.mostrarIngresoInsumo();
    })
  }

  formatDate(element: any): string {
    if (element.fecha) {
      const dateObject = new Date(element.fecha);
      return dateObject.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return '';
  }
}
