import { AfterViewInit, Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CatalogoDto } from '@app/core/models';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupEstadoSalidaComponent } from '../popup/popupEstadoSalida/popup-estado-salida.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-estadosalida',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule],
  templateUrl: './estadosalida.component.html',
  styleUrl: './estadosalida.component.scss'
})
export class EstadosalidaComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'nombre'];
  dataSource = new MatTableDataSource<CatalogoDto>();
  endpoint = 'estado-salida';
  error: string | null = null;

  constructor(private service:CatalogoService, private dialog:MatDialog) { }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.mostrarEstadoSalida();
  }

  mostrarEstadoSalida(){
    this.error = null;
    this.service.getAll(this.endpoint).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      },
      error: (err) => {
        this.error = 'Error al cargar datos: ' + (err.message || 'Error de conexión');
        console.error('Error loading', this.endpoint, err);
      }
    });
  }

  abrirPopup(data:any, estado:any){
    var _popup = this.dialog.open(PopupEstadoSalidaComponent,{
      width:'30%',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data:{data, estado, endpoint: this.endpoint}
    })
    _popup.afterClosed().subscribe(item => {
      this.mostrarEstadoSalida();
    })
  }
}