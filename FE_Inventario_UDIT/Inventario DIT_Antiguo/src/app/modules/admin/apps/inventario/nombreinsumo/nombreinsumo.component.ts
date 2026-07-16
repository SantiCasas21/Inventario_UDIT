import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { NombreInsumo } from '../../../../../../interfaces/nombreinsumo';
import { NombreinsumoService } from '../../../../../../@fuse/services/inventario/nombreinsumo/nombreinsumo.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupNombreInsumoComponent } from '../popup/popupNombreInsumo/popup-nombre-insumo.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-nombreinsumo',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './nombreinsumo.component.html',
  styleUrl: './nombreinsumo.component.scss'
})
export class NombreinsumoComponent implements AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'nombreInsumo'];
  dataSource = new MatTableDataSource<NombreInsumo>();
  datoscompletos:any;

  constructor(private service:NombreinsumoService, private dialog:MatDialog) { }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.mostrarNombreInsumo();
  }

  async mostrarNombreInsumo(){

    try
    {
      //this.dataSource.data  = await this.service.listarLamparas();
      this.datoscompletos = await this.service.listarNombreInsumo();
      this.dataSource.data = this.datoscompletos;
      this.dataSource.paginator = this.paginator;
    }
    catch(err)
    {
      //crear popup de conexion
    }
  }

  abrirPopup(data:any, estado:any){
    var _popup = this.dialog.open(PopupNombreInsumoComponent,{
      width:'30%',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data:{data, estado}
    })
    _popup.afterClosed().subscribe(item => {
      this.mostrarNombreInsumo();
    })
  }
}
