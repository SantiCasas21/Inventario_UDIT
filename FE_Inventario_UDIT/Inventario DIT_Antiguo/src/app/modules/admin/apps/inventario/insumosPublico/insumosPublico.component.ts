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
  selector: 'app-insumosPublico',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './insumosPublico.component.html',
  styleUrl: './insumosPublico.component.scss'
})
export class InsumosPublicoComponent implements AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'idnombreinsumo', 'codfabrica', 'valor', 'idempaquetamiento', 'descripcion', 'idubicacion', 'cantidad'];
  dataSource = new MatTableDataSource<Insumos>();
  datoscompletos:any;
  listadoInsumos:any;

  constructor(private service:InsumosService, private dialog:MatDialog) { }

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
}
