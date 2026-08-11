import { AfterViewInit, Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MovimientoDto, MovimientoFilter } from '@app/core/models';
import { MovimientoService } from '@app/core/services/movimiento.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupIngresoInsumoComponent } from '../popup/popupIngresoInsumo/popup-ingreso-insumo.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-ingresoinsumo',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './ingresoinsumo.component.html',
  styleUrl: './ingresoinsumo.component.scss'
})
export class IngresoinsumoComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'codigoFabrica', 'cantidad', 'proveedorNombre', 'tipoCompraNombre', 'proyectoNombre', 'fecha', 'precioUnitario'];
  dataSource = new MatTableDataSource<MovimientoDto>();

  constructor(private service:MovimientoService, private dialog:MatDialog) { }

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

  mostrarIngresoInsumo(){
    const filter: MovimientoFilter = { tiposMovimiento: ['INGRESO'], pageSize: 1000 };
    this.service.filter(filter).subscribe(result => {
      this.dataSource.data = result.items;
      this.dataSource.paginator = this.paginator;
    });
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
}


