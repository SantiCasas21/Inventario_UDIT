import { AfterViewInit, Component, ViewChild, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-proyectos',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule],
  templateUrl: './proyectos.component.html',
  styleUrl: './proyectos.component.scss'
})
export class ProyectosComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'nombre', 'descripcion', 'idestado', 'fechacreacion'];
  dataSource = new MatTableDataSource<ProyectoDto>();
  error: string | null = null;

  constructor(private service:ProyectoService, private dialog:MatDialog) { }

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

  mostrarProyectos(){
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
}
