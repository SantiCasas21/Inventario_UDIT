import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CatalogoDto, EmpaquetamientoDto } from '@app/core/models';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { MatDialog } from '@angular/material/dialog';
import { PopupEmpaquetamientoComponent } from '../popup/popupEmpaquetamiento/popup-empaquetamiento.component';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '@app/core/user/user.service';

@Component({
  selector: 'app-empaquetamiento',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatPaginatorModule, MatInputModule, MatButtonModule, MatIconModule, MatCardModule, MatTooltipModule],
  templateUrl: './empaquetamiento.component.html',
  styleUrl: './empaquetamiento.component.scss'
})
export class EmpaquetamientoComponent implements OnInit, AfterViewInit {
  userService = inject(UserService);
  fuseConfirmation = inject(FuseConfirmationService);
  snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['editar', 'id', 'tipo', 'familia'];
  dataSource = new MatTableDataSource<EmpaquetamientoDto>();
  endpoint = 'empaquetamiento';
  error: string | null = null;

  /** Mapea el nombre de familia a una clase de badge con color */
  getFamiliaBadgeClass(familia: string | null): string {
    switch (familia) {
      case 'Pasivos SMD': return 'badge-familia-pasivos';
      case 'THT General': return 'badge-familia-tht';
      case 'Discretos y Potencia': return 'badge-familia-discretos';
      case 'ICs y Microcontroladores': return 'badge-familia-ics';
      case 'Genéricos y Otros': return 'badge-familia-genericos';
      default: return 'badge-cat-otro';
    }
  }

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
    if (this.userService.hasRole('admin') && !this.displayedColumns.includes('eliminar')) { this.displayedColumns.push('eliminar'); }
    this.mostrarEmpaquetamiento();
  }

  mostrarEmpaquetamiento(){
    this.error = null;
    this.service.getAll(this.endpoint).subscribe({
      next: (data) => {
        // El backend retorna EmpaquetamientoDto[] (con familia) \u2014 el gen\u00e9rico lo tipa como CatalogoDto[]
        this.dataSource.data = data as EmpaquetamientoDto[];
        this.dataSource.paginator = this.paginator;
      },
      error: (err) => {
        this.error = 'Error al cargar datos: ' + (err.message || 'Error de conexi\u00f3n');
        console.error('Error loading', this.endpoint, err);
      }
    });
  }

  abrirPopup(data:any, estado:any){
    var _popup = this.dialog.open(PopupEmpaquetamientoComponent,{
      width:'30%',
      enterAnimationDuration: '500ms',
      exitAnimationDuration: '500ms',
      data:{data, estado, endpoint: this.endpoint}
    })
    _popup.afterClosed().subscribe(item => {
      this.mostrarEmpaquetamiento();
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
        this.service.delete(this.endpoint, row.id).subscribe({
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

