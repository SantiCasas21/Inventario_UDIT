import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MovimientoService } from '@app/core/services/movimiento.service';
import { ExcelPlantillaService } from '@app/core/services/excel-plantilla.service';
import { CatalogoService } from '@app/core/services/catalogo.service';
import { InsumoService } from '@app/core/services/insumo.service';
import { UserService } from '@app/core/user/user.service';
import { IngresoPreviewItemDto, IngresoPreviewResponseDto, MovimientoRequest, UbicacionStockOption, CatalogoDto } from '@app/core/models';
import { PopupInsumosComponent } from '@app/modules/admin/apps/inventario/popup/popupInsumos/popup-insumos.component';
import { PopupProveedoresComponent } from '@app/modules/admin/apps/inventario/popup/popupProveedores/popup-proveedores.component';
import { PopupEmpaquetamientoComponent } from '@app/modules/admin/apps/inventario/popup/popupEmpaquetamiento/popup-empaquetamiento.component';
import { ModalConfirmacionAccionComponent, ConfirmacionAccionData } from '@app/shared/components/modal-confirmacion-accion/modal-confirmacion-accion.component';
import { ConfirmacionService } from '@app/core/services/confirmacion.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-popup-import-ingresos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './popup-import-ingresos.component.html',
  styleUrls: ['./popup-import-ingresos.component.scss']
})
export class PopupImportIngresosComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PopupImportIngresosComponent>);
  private movimientoService = inject(MovimientoService);
  private plantillaService = inject(ExcelPlantillaService);
  private catalogoService = inject(CatalogoService);
  private insumoService = inject(InsumoService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private confirmacionService = inject(ConfirmacionService);

  step: 'UPLOAD' | 'PREVIEW' = 'UPLOAD';
  isDragging = false;
  isProcessing = false;
  isSubmitting = false;
  selectedFileName = '';

  rows: IngresoPreviewItemDto[] = [];
  categorias: CatalogoDto[] = [];
  empaquetamientos: CatalogoDto[] = [];
  unidadesMedida: any[] = [];
  proveedores: CatalogoDto[] = [];
  tiposCompra: CatalogoDto[] = [];
  todasUbicaciones: UbicacionStockOption[] = [];

  // Modo edición por fila
  editandoFilaIndex: number | null = null;

  // Filtro de pestañas
  tabFiltro: 'TODOS' | 'LISTOS' | 'PENDIENTES' = 'TODOS';

  // Métricas
  totalFilas = 0;
  totalValidas = 0;
  totalInsumosNuevos = 0;
  totalProveedoresNuevos = 0;
  totalCategoriasNuevas = 0;
  totalEmpaquetamientosNuevos = 0;
  totalDuplicados = 0;
  totalInversionEstimada = 0;

  get canCreateInsumo(): boolean {
    return this.userService.hasPermission('insumos.crear') || this.userService.hasRole(['Admin', 'Developer']);
  }

  get canCreateProveedor(): boolean {
    return this.userService.hasPermission('proveedores.crear') || this.userService.hasRole(['Admin', 'Developer']);
  }

  get canCreateEmpaquetamiento(): boolean {
    return this.userService.hasPermission('catalogos.crear') || this.userService.hasRole(['Admin', 'Developer']);
  }

  ngOnInit(): void {
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    forkJoin({
      categorias: this.catalogoService.getAll('categoria-insumo'),
      empaquetamientos: this.catalogoService.getAll('empaquetamiento'),
      unidades: this.catalogoService.getAll('unidad-medida'),
      proveedores: this.catalogoService.getAll('proveedor'),
      tiposCompra: this.catalogoService.getAll('tipo-compra'),
      ubicaciones: this.catalogoService.getAll('ubicacion')
    }).subscribe(res => {
      this.categorias = (res.categorias || []).filter(c => c && c.nombre?.trim());
      this.empaquetamientos = (res.empaquetamientos || []).filter(e => e && e.nombre?.trim());
      this.unidadesMedida = res.unidades || [];
      this.proveedores = (res.proveedores || []).filter(p => p && p.nombre?.trim());
      this.tiposCompra = (res.tiposCompra || []).filter(t => t && t.nombre?.trim());
      this.todasUbicaciones = (res.ubicaciones || [])
        .filter(u => u && u.nombre && u.nombre.trim().length > 0)
        .map(u => ({ idUbicacion: u.id, ubicacionNombre: u.nombre, stock: 0 }));
    });
  }

  descargarPlantilla(): void {
    // Consultar catálogos en tiempo real antes de descargar
    forkJoin({
      categorias: this.catalogoService.getAll('categoria-insumo'),
      empaquetamientos: this.catalogoService.getAll('empaquetamiento'),
      unidades: this.catalogoService.getAll('unidad-medida'),
      proveedores: this.catalogoService.getAll('proveedor'),
      tiposCompra: this.catalogoService.getAll('tipo-compra')
    }).subscribe(res => {
      this.categorias = (res.categorias || []).filter(c => c && c.nombre?.trim());
      this.empaquetamientos = (res.empaquetamientos || []).filter(e => e && e.nombre?.trim());
      this.unidadesMedida = res.unidades || [];
      this.proveedores = (res.proveedores || []).filter(p => p && p.nombre?.trim());
      this.tiposCompra = (res.tiposCompra || []).filter(t => t && t.nombre?.trim());

      this.plantillaService.descargarPlantillaOficial(
        this.categorias,
        this.empaquetamientos,
        this.unidadesMedida,
        this.tiposCompra,
        this.proveedores
      );
      this.snackBar.open('Plantilla oficial descargada con catálogo actualizado en tiempo real', 'Cerrar', { duration: 3500 });
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.procesarArchivo(file);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.procesarArchivo(input.files[0]);
    }
  }

  procesarArchivo(file: File): void {
    const validExtensions = ['.xlsx', '.xls', '.csv', '.txt'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      this.snackBar.open('Formato no soportado. Seleccione un archivo Excel (.xlsx, .xls) o CSV.', 'Cerrar', { duration: 5000 });
      return;
    }

    this.selectedFileName = file.name;
    this.isProcessing = true;

    this.movimientoService.previewExcel(file).subscribe({
      next: (res: IngresoPreviewResponseDto) => {
        this.isProcessing = false;
        this.rows = res.filas || [];
        
        // Completar ubicaciones
        this.rows.forEach(r => {
          if (!r.ubicacionesDisponibles || r.ubicacionesDisponibles.length === 0) {
            r.ubicacionesDisponibles = [...this.todasUbicaciones];
          } else {
            this.todasUbicaciones.forEach(tu => {
              if (!r.ubicacionesDisponibles.some(u => u.idUbicacion === tu.idUbicacion)) {
                r.ubicacionesDisponibles.push(tu);
              }
            });
          }
          this.evaluarFila(r);
        });

        this.recalcularMetricas();
        this.step = 'PREVIEW';
        this.snackBar.open(`Se leyeron ${this.rows.length} registros del archivo Excel`, 'Cerrar', { duration: 3500 });
      },
      error: err => {
        this.isProcessing = false;
        this.snackBar.open('Error al leer el archivo: ' + (err.error?.message || err.message || 'Error desconocido'), 'Cerrar', { duration: 6000 });
      }
    });
  }

  evaluarFila(row: IngresoPreviewItemDto): void {
    if (!row.insumoExiste) {
      row.estadoValidacion = 'INSUMO_NO_REGISTRADO';
      row.mensajeError = 'Insumo no registrado en el sistema. Créalo con un clic con los datos del Excel prellenados.';
    } else if (!row.cantidad || row.cantidad <= 0) {
      row.estadoValidacion = 'CANTIDAD_INVALIDA';
      row.mensajeError = 'La cantidad debe ser mayor a 0.';
    } else if (!row.idUbicacion) {
      row.estadoValidacion = 'REQUIERE_UBICACION';
      row.mensajeError = 'Seleccione una ubicación para el ingreso.';
    } else if (row.proveedorTextoExcel && !row.idProveedor) {
      row.estadoValidacion = 'PROVEEDOR_NO_REGISTRADO';
      row.mensajeError = `El proveedor "${row.proveedorTextoExcel}" no existe. Créalo o selecciona uno de la lista.`;
    } else if (row.categoriaTextoExcel && !row.idCategoria) {
      row.estadoValidacion = 'CATEGORIA_NO_REGISTRADA';
      row.mensajeError = `La categoría "${row.categoriaTextoExcel}" no existe.`;
    } else if (row.empaquetamientoTextoExcel && !row.idEmpaquetamiento) {
      row.estadoValidacion = 'EMPAQUETAMIENTO_NO_REGISTRADO';
      row.mensajeError = `El empaquetamiento "${row.empaquetamientoTextoExcel}" no existe.`;
    } else {
      row.estadoValidacion = 'OK';
      row.mensajeError = null;
    }
  }

  toggleEditarFila(index: number): void {
    if (this.editandoFilaIndex === index) {
      this.editandoFilaIndex = null;
      if (this.rows[index]) {
        this.evaluarFila(this.rows[index]);
      }
      this.recalcularMetricas();
      this.snackBar.open('Cambios de la fila guardados', 'Cerrar', { duration: 2000 });
    } else {
      this.editandoFilaIndex = index;
      this.snackBar.open(`Editando fila #${index + 1}. Modifica los campos y haz clic en Guardar (✓).`, 'Cerrar', { duration: 3000 });
    }
  }

  eliminarFila(index: number): void {
    if (index >= 0 && index < this.rows.length) {
      const codigo = this.rows[index].codigoFabrica;
      this.rows.splice(index, 1);
      if (this.editandoFilaIndex === index) {
        this.editandoFilaIndex = null;
      } else if (this.editandoFilaIndex !== null && this.editandoFilaIndex > index) {
        this.editandoFilaIndex--;
      }
      this.recalcularMetricas();
      this.snackBar.open(`Insumo "${codigo}" eliminado del lote`, 'Cerrar', { duration: 2500 });
      if (this.rows.length === 0) {
        this.step = 'UPLOAD';
      }
    }
  }

  trackByItem(index: number, item: { row: IngresoPreviewItemDto, originalIndex: number }): any {
    return item.row.codigoFabrica + '_' + item.originalIndex;
  }

  onUbicacionChange(row: IngresoPreviewItemDto, ubiId: number): void {
    row.idUbicacion = ubiId;
    const match = this.todasUbicaciones.find(u => u.idUbicacion === ubiId);
    row.ubicacionNombre = match ? match.ubicacionNombre : '';
    this.evaluarFila(row);
    this.recalcularMetricas();
  }

  onProveedorChange(row: IngresoPreviewItemDto, provId: number | null): void {
    row.idProveedor = provId;
    const match = this.proveedores.find(p => p.id === provId);
    row.proveedorNombre = match ? match.nombre : null;
    if (provId) {
      row.proveedorTextoExcel = null;
      row.proveedorExiste = true;
    }
    this.evaluarFila(row);
    this.recalcularMetricas();
  }

  onCategoriaChange(row: IngresoPreviewItemDto, catId: number | null): void {
    row.idCategoria = catId;
    const match = this.categorias.find(c => c.id === catId);
    row.categoriaNombre = match ? match.nombre : null;
    if (catId) {
      row.categoriaTextoExcel = null;
      row.categoriaExiste = true;
    }
    this.evaluarFila(row);
    this.recalcularMetricas();
  }

  onEmpaquetamientoChange(row: IngresoPreviewItemDto, empId: number | null): void {
    row.idEmpaquetamiento = empId;
    const match = this.empaquetamientos.find(e => e.id === empId);
    row.empaquetamientoNombre = match ? match.nombre : null;
    if (empId) {
      row.empaquetamientoTextoExcel = null;
      row.empaquetamientoExiste = true;
    }
    this.evaluarFila(row);
    this.recalcularMetricas();
  }

  onValorChange(row: IngresoPreviewItemDto): void {
    this.evaluarFila(row);
    this.recalcularMetricas();
  }

  crearInsumoRapido(row: IngresoPreviewItemDto): void {
    const dialogRef = this.dialog.open(PopupInsumosComponent, {
      width: '560px',
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '150ms',
      data: {
        estado: 1, // Crear
        data: {
          codigoFabrica: (row.codigoFabrica || '').trim(),
          descripcion: (row.descripcion || '').trim(),
          idCategoria: row.idCategoria || null,
          idEmpaquetamiento: row.idEmpaquetamiento || null,
          valorMedida: row.valorMedida || null,
          unidadMedida: row.unidadMedida || '',
          precioReferencia: (row.precioUnitario && row.precioUnitario > 0) ? row.precioUnitario : null,
          moneda: 'COP'
        }
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const codigo = res.codigoFabrica || row.codigoFabrica;
        this.snackBar.open(`Insumo "${codigo}" creado exitosamente`, 'Cerrar', { duration: 3000 });
        
        // Consultar el insumo recién creado
        this.insumoService.filter({ textSearch: codigo, pageSize: 10 }).subscribe(queryRes => {
          const found = (queryRes.items || []).find(i => i.codigoFabrica.toLowerCase() === codigo.toLowerCase()) || queryRes.items[0];
          if (found) {
            this.rows.forEach(r => {
              if (r.codigoFabrica.toLowerCase() === codigo.toLowerCase()) {
                r.insumoExiste = true;
                r.idInsumo = found.id;
                r.descripcion = found.descripcion;
                r.idCategoria = found.idCategoria;
                r.categoriaNombre = found.categoriaNombre;
                r.idEmpaquetamiento = found.idEmpaquetamiento;
                r.empaquetamientoNombre = found.empaquetamientoNombre;
                r.valorMedida = found.valorMedida;
                r.unidadMedida = found.unidadMedida;

                if (!r.precioUnitario || r.precioUnitario <= 0) {
                  r.precioUnitario = found.precioReferencia;
                }
                
                // No asignar ubicación automáticamente: dejar que el usuario elija
                r.idUbicacion = null;
                r.ubicacionNombre = null;
                r.ubicacionesDisponibles = [...this.todasUbicaciones];

                this.evaluarFila(r);
              }
            });

            // Abrir automáticamente la fila en modo edición para seleccionar ubicación
            const idxCreated = this.rows.findIndex(x => x.codigoFabrica.toLowerCase() === codigo.toLowerCase());
            if (idxCreated !== -1) {
              this.editandoFilaIndex = idxCreated;
            }

            this.recalcularMetricas();
            this.snackBar.open(`Insumo "${codigo}" creado. Por favor selecciona la ubicación de ingreso deseada.`, 'Cerrar', { duration: 4000 });
          }
        });
      }
    });
  }

  crearProveedorRapido(row: IngresoPreviewItemDto): void {
    const dialogRef = this.dialog.open(PopupProveedoresComponent, {
      width: '540px',
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '150ms',
      data: {
        data: {
          nombre: (row.proveedorTextoExcel || '').trim()
        }
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const provBuscado = (row.proveedorTextoExcel || '').trim();
        this.snackBar.open(`Proveedor registrado exitosamente`, 'Cerrar', { duration: 3000 });
        
        this.catalogoService.getAll('proveedor').subscribe(resCatalog => {
          this.proveedores = (resCatalog || []).filter(p => p && p.nombre?.trim());
          const found = this.proveedores.find(p => p.nombre.trim().toLowerCase() === provBuscado.toLowerCase()) || this.proveedores[this.proveedores.length - 1];
          if (found) {
            this.rows.forEach(r => {
              if (r.proveedorTextoExcel && r.proveedorTextoExcel.trim().toLowerCase() === provBuscado.toLowerCase()) {
                r.idProveedor = found.id;
                r.proveedorNombre = found.nombre;
                r.proveedorTextoExcel = null;
                r.proveedorExiste = true;
                this.evaluarFila(r);
              }
            });
            this.recalcularMetricas();
          }
        });
      }
    });
  }

  crearEmpaquetamientoRapido(row: IngresoPreviewItemDto): void {
    const dialogRef = this.dialog.open(PopupEmpaquetamientoComponent, {
      width: '540px',
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '150ms',
      data: {
        data: {
          tipo: (row.empaquetamientoTextoExcel || '').trim()
        }
      }
    });

    dialogRef.afterClosed().subscribe(res => {
      if (res) {
        const empBuscado = (row.empaquetamientoTextoExcel || '').trim();
        this.snackBar.open(`Empaquetamiento registrado exitosamente`, 'Cerrar', { duration: 3000 });
        
        this.catalogoService.getAll('empaquetamiento').subscribe(resCatalog => {
          this.empaquetamientos = (resCatalog || []).filter(e => e && e.nombre?.trim());
          const found = this.empaquetamientos.find(e => e.nombre.trim().toLowerCase() === empBuscado.toLowerCase()) || this.empaquetamientos[this.empaquetamientos.length - 1];
          if (found) {
            this.rows.forEach(r => {
              if (r.empaquetamientoTextoExcel && r.empaquetamientoTextoExcel.trim().toLowerCase() === empBuscado.toLowerCase()) {
                r.idEmpaquetamiento = found.id;
                r.empaquetamientoNombre = found.nombre;
                r.empaquetamientoTextoExcel = null;
                r.empaquetamientoExiste = true;
                this.evaluarFila(r);
              }
            });
            this.recalcularMetricas();
          }
        });
      }
    });
  }

  recalcularMetricas(): void {
    this.totalFilas = this.rows.length;
    this.totalValidas = this.rows.filter(r => r.estadoValidacion === 'OK').length;
    this.totalInsumosNuevos = this.rows.filter(r => !r.insumoExiste).length;
    this.totalProveedoresNuevos = this.rows.filter(r => r.proveedorTextoExcel && !r.idProveedor).length;
    this.totalCategoriasNuevas = this.rows.filter(r => r.categoriaTextoExcel && !r.idCategoria).length;
    this.totalEmpaquetamientosNuevos = this.rows.filter(r => r.empaquetamientoTextoExcel && !r.idEmpaquetamiento).length;
    this.totalDuplicados = this.rows.filter(r => r.esDuplicadoEnLote).length;

    this.totalInversionEstimada = this.rows.reduce((acc, r) => {
      const p = (r.precioUnitario && r.precioUnitario > 0) ? r.precioUnitario : 0;
      const c = (r.cantidad && r.cantidad > 0) ? r.cantidad : 0;
      return acc + (c * p);
    }, 0);
  }

  /**
   * Filtra en tiempo real las ubicaciones disponibles para una fila específica,
   * excluyendo las ubicaciones que ya han sido seleccionadas por otras filas del lote.
   */
  getUbicacionesDisponibles(row: IngresoPreviewItemDto): UbicacionStockOption[] {
    const ocupadasPorOtras = new Set<number>();
    this.rows.forEach(r => {
      if (r !== row && r.idUbicacion) {
        ocupadasPorOtras.add(r.idUbicacion);
      }
    });

    return this.todasUbicaciones.filter(u => 
      !ocupadasPorOtras.has(u.idUbicacion) || u.idUbicacion === row.idUbicacion
    );
  }

  get filasFiltradas(): { row: IngresoPreviewItemDto, originalIndex: number }[] {
    const list = this.rows.map((r, i) => ({ row: r, originalIndex: i }));
    if (this.tabFiltro === 'LISTOS') {
      return list.filter(x => x.row.estadoValidacion === 'OK');
    }
    if (this.tabFiltro === 'PENDIENTES') {
      return list.filter(x => x.row.estadoValidacion !== 'OK');
    }
    return list;
  }

  get todasValidas(): boolean {
    return this.rows.length > 0 && this.rows.every(r => r.estadoValidacion === 'OK');
  }

  cambiarArchivo(): void {
    this.rows = [];
    this.selectedFileName = '';
    this.editandoFilaIndex = null;
    this.step = 'UPLOAD';
  }

  confirmarIngresoMasivo(): void {
    if (!this.todasValidas) {
      this.snackBar.open('Por favor corrige las filas pendientes antes de ingresar.', 'Cerrar', { duration: 5000 });
      return;
    }

    const totalUnidades = this.rows.reduce((acc, r) => acc + (r.cantidad || 0), 0);

    const dialogData: ConfirmacionAccionData = {
      titulo: 'Confirmar Ingreso Masivo de Insumos',
      subtitulo: `Se registrarán ${this.rows.length} movimientos de entrada en el Kardex e inventario oficial.`,
      icono: 'inventory',
      tipo: 'ingreso',
      metricas: [
        { label: 'Insumos Distintos', value: this.rows.length, colorClass: 'text-slate-900' },
        { label: 'Total Unidades', value: `${totalUnidades} un.`, colorClass: 'text-emerald-700' },
        { label: 'Inversión Total', value: `$ ${this.totalInversionEstimada.toLocaleString('es-CO')} COP`, colorClass: 'text-emerald-800' }
      ],
      items: this.rows.map(r => ({
        codigo: r.codigoFabrica,
        descripcion: r.descripcion,
        cantidad: r.cantidad,
        ubicacion: r.ubicacionNombre,
        precioUnitario: r.precioUnitario,
        proveedor: r.proveedorNombre,
        tipoCompra: r.tipoCompraNombre
      })),
      mensajeAdvertencia: 'Esta acción actualizará el stock disponible en cada ubicación y el precio de referencia de los insumos ingresados.',
      btnConfirmarTexto: `Sí, ingresar ${this.rows.length} insumos`,
      btnCancelarTexto: 'Volver a revisar'
    };

    this.confirmacionService.confirmar(dialogData).subscribe(confirmado => {
      if (confirmado) {
        this.ejecutarIngresoMasivo();
      }
    });
  }

  private ejecutarIngresoMasivo(): void {
    const usuario = this.userService.currentUser?.email || this.userService.currentUser?.nombreCompleto || 'Sistema';

    const movs: MovimientoRequest[] = this.rows.map(r => ({
      idInsumo: r.idInsumo!,
      cantidad: r.cantidad,
      precioUnitario: (r.precioUnitario && r.precioUnitario > 0) ? r.precioUnitario : undefined,
      moneda: 'COP',
      idUbicacion: r.idUbicacion!,
      idProveedor: r.idProveedor || undefined,
      idTipoCompra: r.idTipoCompra || undefined,
      observacion: r.observacion ? `[Importación Excel] ${r.observacion}` : '[Importación Excel]',
      usuarioRegistro: usuario
    }));

    this.isSubmitting = true;
    this.movimientoService.registrarIngresoMasivo(movs).subscribe({
      next: res => {
        this.isSubmitting = false;
        this.snackBar.open(`¡Ingreso masivo exitoso! Se procesaron ${res.totalProcesados} insumos por $ ${res.totalInvertido.toLocaleString('es-CO')} COP`, 'Cerrar', { duration: 5000 });
        this.dialogRef.close(true);
      },
      error: err => {
        this.isSubmitting = false;
        this.snackBar.open('Error al registrar ingreso masivo: ' + (err.error?.message || err.message || 'Error desconocido'), 'Cerrar', { duration: 6000 });
      }
    });
  }

  cerrar(): void {
    this.dialogRef.close(false);
  }
}
