import { inject, AfterViewInit, Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '@app/core/user/user.service';
import { ConfirmacionService } from '@app/core/services/confirmacion.service';
import { CatalogoDto } from '@app/core/models';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { PopupNombreInsumoComponent } from '../popup/popupNombreInsumo/popup-nombre-insumo.component';
import { CategoriaBadgePipe } from '@app/shared/pipes/categoria-badge.pipe';

@Component({
  selector: 'app-nombreinsumo',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    CategoriaBadgePipe
  ],
  templateUrl: './nombreinsumo.component.html',
  styleUrl: './nombreinsumo.component.scss'
})
export class NombreinsumoComponent implements OnInit, AfterViewInit {
  userService = inject(UserService);
  confirmacionService = inject(ConfirmacionService);
  snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['editar', 'id', 'nombreInsumo', 'eliminar'];
  dataSource = new MatTableDataSource<CatalogoDto>([]);
  endpoint = 'categoria-insumo';
  error: string | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private catalogoService: CatalogoService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  cargarDatos(): void {
    this.catalogoService.getAll(this.endpoint).subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => {
        this.error = err.message || 'Error al cargar las categorías';
      }
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  abrirPopup(elemento?: CatalogoDto, estado: number = 1): void {
    const dialogRef = this.dialog.open(PopupNombreInsumoComponent, {
      width: '100%',
      maxWidth: '520px',
      panelClass: 'responsive-dialog-panel',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '300ms',
      data: {
        estado: estado,
        data: elemento ? { ...elemento } : null,
        endpoint: this.endpoint
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarDatos();
      }
    });
  }

  eliminarRegistro(element: CatalogoDto): void {
    const nombre = element.nombre || `ID ${element.id}`;
    this.confirmacionService.confirmarEliminacion('Categoría de Insumo', nombre).subscribe(confirmado => {
      if (confirmado) {
        this.catalogoService.delete(this.endpoint, element.id).subscribe({
          next: () => {
            this.snackBar.open('Categoría eliminada exitosamente', 'Cerrar', { duration: 3000 });
            this.cargarDatos();
          },
          error: (err: any) => {
            const msg = err.message || err.error?.message || err.error?.Message || (typeof err.error === 'string' ? err.error : 'No se puede eliminar esta categoría porque está siendo utilizada en insumos o movimientos del sistema.');
            this.confirmacionService.mostrarAdvertencia('No es posible eliminar la categoría', msg, `Categoría: "${nombre}"`);
          }
        });
      }
    });
  }
}
