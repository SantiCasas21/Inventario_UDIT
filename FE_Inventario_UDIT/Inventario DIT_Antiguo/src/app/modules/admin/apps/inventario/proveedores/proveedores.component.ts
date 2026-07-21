import { AfterViewInit, Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ProveedorFullDto } from '@app/core/models';
import { ProveedorFullService } from '@app/core/services/proveedor-full.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupProveedoresComponent } from '../popup/popupProveedores/popup-proveedores.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.scss'
})
export class ProveedoresComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'nombre', 'contacto', 'direccion'];
  dataSource = new MatTableDataSource<ProveedorFullDto>();
  error: string | null = null;

  constructor(private service:ProveedorFullService, private dialog:MatDialog) { }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.mostrarProveedores();
  }

  mostrarProveedores(){
    this.error = null;
    this.service.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.paginator = this.paginator;
      },
      error: (err) => {
        this.error = 'Error al cargar datos: ' + (err.message || 'Error de conexión');
        console.error('Error loading proveedores', err);
      }
    });
  }

  abrirPopup(data:any, estado:any){
    var _popup = this.dialog.open(PopupProveedoresComponent,{
      width:'30%',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data:{data, estado}
    })
    _popup.afterClosed().subscribe(item => {
      this.mostrarProveedores();
    })
  }
}
