import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Empaquetamiento } from '../../../../../../interfaces/empaquetamiento';
import {EmpaquetamientoService } from '../../../../../../@fuse/services/inventario/empaquetamiento/empaquetamiento.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupEmpaquetamientoComponent } from '../popup/popupEmpaquetamiento/popup-empaquetamiento.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empaquetamiento',
  standalone: true,
  imports: [MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './empaquetamiento.component.html',
  styleUrl: './empaquetamiento.component.scss'
})
export class EmpaquetamientoComponent implements AfterViewInit {
  displayedColumns: string[] = ['editar', 'id', 'tipo'];
  dataSource = new MatTableDataSource<Empaquetamiento>();
  datoscompletos:any;

  constructor(private service:EmpaquetamientoService, private dialog:MatDialog) { }

  @ViewChild(MatPaginator) paginator: MatPaginator;

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnInit(): void {
    this.mostrarEmpaquetamiento();
  }

  async mostrarEmpaquetamiento(){

    try
    {
      //this.dataSource.data  = await this.service.listarLamparas();
      this.datoscompletos = await this.service.listarEmpaquetamiento();
      this.dataSource.data = this.datoscompletos;
      this.dataSource.paginator = this.paginator;
    }
    catch(err)
    {
      //crear popup de conexion
    }
  }

  abrirPopup(data:any, estado:any){
    var _popup = this.dialog.open(PopupEmpaquetamientoComponent,{
      width:'30%',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data:{data, estado}
    })
    _popup.afterClosed().subscribe(item => {
      this.mostrarEmpaquetamiento();
    })
  }
}
