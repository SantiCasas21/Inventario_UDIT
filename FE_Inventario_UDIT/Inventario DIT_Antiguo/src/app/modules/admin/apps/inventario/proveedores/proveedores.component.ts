import { inject } from '@angular/core';
import { UserService } from '@app/core/user/user.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatSnackBar } from '@angular/material/snack-bar';
﻿import { AfterViewInit, Component, ViewChild, OnInit } from '@angular/core';
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
  userService = inject(UserService);
  fuseConfirmation = inject(FuseConfirmationService);
  snackBar = inject(MatSnackBar);

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
    if (this.userService.hasRole('admin') && !this.displayedColumns.includes('eliminar')) { this.displayedColumns.push('eliminar'); }
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
        this.error = 'Error al cargar datos: ' + (err.message || 'Error de conexi\u00f3n');
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

  eliminarRegistro(row: any) {
    const dialog = this.fuseConfirmation.open({
      title: 'Eliminar registro',
      message: '\u00bfEst\u00e1 seguro de eliminar este registro? Esta acci\u00f3n no se puede deshacer.',
      icon: { name: 'heroicons_outline:trash', color: 'warn' },
      actions: { confirm: { label: 'S\u00ed, eliminar', color: 'warn' }, cancel: { label: 'Cancelar' } },
    });
    dialog.afterClosed().subscribe(result => {
      if (result === 'confirmed') {
        this.service.delete(row.id).subscribe({
          next: () => {
            this.snackBar.open('Registro eliminado', 'Cerrar', { duration: 3000 });
            this.ngOnInit();
          },
          error: (err:any) => {
            const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'No se puede eliminar este registro porque est\u00e1 siendo utilizado en insumos o movimientos del sistema.');
            this.fuseConfirmation.open({
              title: 'Error al eliminar',
              message: msg,
              icon: { show: true, name: 'heroicons_outline:exclamation-triangle', color: 'warn' },
              actions: { confirm: { show: true, label: 'Entendido', color: 'primary' }, cancel: { show: false, label: 'Cancelar' } }
            });
          }
        });
      }
    });
  }
}

