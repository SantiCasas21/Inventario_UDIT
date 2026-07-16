import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Proyectos } from '../../../../../../interfaces/proyectos';
import { ProyectosService } from '../../../../../../@fuse/services/inventario/proyectos/proyectos.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupProyectosComponent } from '../popup/popupProyectos/popup-proyectos.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './proyectos.component.html',
  styleUrl: './proyectos.component.scss'
})
export class ProyectosComponent implements AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'nombre', 'descripcion', 'idestado', 'fechacreacion'];
  dataSource = new MatTableDataSource<Proyectos>();
  datoscompletos:any;

  constructor(private service:ProyectosService, private dialog:MatDialog) { }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }


  ngOnInit(): void {
    this.mostrarProyectos();
  }

  async mostrarProyectos(){

    try
    {
      this.datoscompletos = await this.service.listarProyectos();
      this.dataSource.data = this.datoscompletos.listasProyectos;
      this.dataSource.paginator = this.paginator;
    }
    catch(err)
    {
      //crear popup de conexion
    }
  }

  abrirPopup(data:any, estado:any){
    var _popup = this.dialog.open(PopupProyectosComponent,{
      width:'30%',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data:{data, estado}
    })
    _popup.afterClosed().subscribe(item => {
      this.mostrarProyectos();
    })
  }

  formatDate(element: any): string {
    if (element.fechaCreacion) {
      const dateObject = new Date(element.fechaCreacion);
      return dateObject.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    return '';
  }
}
