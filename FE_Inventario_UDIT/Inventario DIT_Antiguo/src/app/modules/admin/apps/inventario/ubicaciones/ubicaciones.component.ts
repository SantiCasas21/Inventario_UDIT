import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Ubicaciones } from '../../../../../../interfaces/ubicaciones';
import { UbicacionesService } from '../../../../../../@fuse/services/inventario/ubicaciones/ubicaciones.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupUbicacionesComponent } from '../popup/popupUbicaciones/popup-ubicaciones.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ubicaciones',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './ubicaciones.component.html',
  styleUrl: './ubicaciones.component.scss'
})
export class UbicacionesComponent implements AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'ubicacion'];
  dataSource = new MatTableDataSource<Ubicaciones>();
  datoscompletos:any;

  constructor(private service:UbicacionesService, private dialog:MatDialog) { }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.mostrarUbicaciones();
  }

  async mostrarUbicaciones(){

    try
    {
      //this.dataSource.data  = await this.service.listarLamparas();
      this.datoscompletos = await this.service.listarUbicaciones();
      this.dataSource.data = this.datoscompletos;
      this.dataSource.paginator = this.paginator;
    }
    catch(err)
    {
      //crear popup de conexion
    }
  }

  abrirPopup(data:any, estado:any){
    var _popup = this.dialog.open(PopupUbicacionesComponent,{
      width:'30%',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data:{data, estado}
    })
    _popup.afterClosed().subscribe(item => {
      this.mostrarUbicaciones();
    })
  }
}