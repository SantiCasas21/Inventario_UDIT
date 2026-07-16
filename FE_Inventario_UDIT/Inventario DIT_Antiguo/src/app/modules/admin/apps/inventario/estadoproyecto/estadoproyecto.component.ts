import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { EstadoProyecto } from '../../../../../../interfaces/estadoproyecto';
import { EstadoproyectoService } from '../../../../../../@fuse/services/inventario/estadoproyecto/estadoproyecto.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupEstadoProyectoComponent } from '../popup/popupEstadoProyecto/popup-estado-proyecto.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-estadoproyecto',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './estadoproyecto.component.html',
  styleUrl: './estadoproyecto.component.scss'
})
export class EstadoproyectoComponent implements AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'estado'];
  dataSource = new MatTableDataSource<EstadoProyecto>();
  datoscompletos:any;

  constructor(private service:EstadoproyectoService, private dialog:MatDialog) { }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.mostrarEstadoProyecto();
  }

  async mostrarEstadoProyecto(){

    try
    {
      //this.dataSource.data  = await this.service.listarLamparas();
      this.datoscompletos = await this.service.listarEstadoProyecto();
      this.dataSource.data = this.datoscompletos;
      this.dataSource.paginator = this.paginator;
    }
    catch(err)
    {
      //crear popup de conexion
    }
  }

  abrirPopup(data:any, estado:any){
    var _popup = this.dialog.open(PopupEstadoProyectoComponent,{
      width:'30%',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data:{data, estado}
    })
    _popup.afterClosed().subscribe(item => {
      this.mostrarEstadoProyecto();
    })
  }
}