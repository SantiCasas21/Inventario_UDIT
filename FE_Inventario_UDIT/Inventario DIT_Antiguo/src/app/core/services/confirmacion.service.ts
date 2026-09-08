import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { ModalConfirmacionAccionComponent, ConfirmacionAccionData } from '@app/shared/components/modal-confirmacion-accion/modal-confirmacion-accion.component';

@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  private dialog = inject(MatDialog);

  /**
   * Abre un modal global de confirmación visualmente enriquecido con métricas y lista detallada de acciones.
   */
  confirmar(config: ConfirmacionAccionData): Observable<any> {
    const isWide = !!(config.items && config.items.length > 0);
    const dialogRef = this.dialog.open(ModalConfirmacionAccionComponent, {
      width: '100%',
      maxWidth: isWide ? '680px' : '520px',
      panelClass: [
        'custom-dialog-container',
        'confirmacion-dialog-panel',
        isWide ? 'confirmacion-dialog-panel-wide' : 'confirmacion-dialog-panel-compact'
      ],
      data: config,
      enterAnimationDuration: '200ms',
      exitAnimationDuration: '150ms',
      disableClose: true
    });

    return dialogRef.afterClosed();
  }

  /**
   * Confirmación estándar para eliminar registros en catálogos o entidades.
   */
  confirmarEliminacion(recurso: string, nombreElemento?: string): Observable<boolean> {
    return this.confirmar({
      titulo: `Eliminar ${recurso}`,
      subtitulo: nombreElemento ? `¿Está seguro de eliminar "${nombreElemento}"?` : `¿Está seguro de eliminar este registro de ${recurso}?`,
      icono: 'delete_forever',
      tipo: 'eliminar',
      mensajeAdvertencia: 'Esta acción no se puede deshacer y puede afectar la trazabilidad si existen registros asociados.',
      btnConfirmarTexto: 'Sí, eliminar',
      btnCancelarTexto: 'Cancelar'
    });
  }

  /**
   * Confirmación estándar para guardar o actualizar registros.
   */
  confirmarGuardado(recurso: string, esEdicion: boolean = false, nombreElemento?: string): Observable<boolean> {
    const accion = esEdicion ? 'Actualizar' : 'Crear';
    return this.confirmar({
      titulo: `${accion} ${recurso}`,
      subtitulo: nombreElemento ? `¿Desea guardar los datos de "${nombreElemento}"?` : `¿Desea registrar este nuevo ${recurso}?`,
      icono: esEdicion ? 'edit' : 'add_circle',
      tipo: esEdicion ? 'editar' : 'crear',
      btnConfirmarTexto: `Sí, ${accion.toLowerCase()}`,
      btnCancelarTexto: 'Revisar'
    });
  }

  /**
   * Muestra un modal de advertencia con validación y botón de cierre/entendido.
   */
  mostrarAdvertencia(titulo: string, mensaje: string, subtitulo?: string): Observable<any> {
    return this.confirmar({
      titulo: titulo || 'Advertencia de Validación',
      subtitulo: subtitulo || 'Por favor revise las condiciones requeridas',
      icono: 'warning',
      tipo: 'advertencia',
      mensajePrincipal: mensaje,
      soloAceptar: true,
      btnConfirmarTexto: 'Entendido'
    });
  }

  /**
   * Muestra un modal de error con diseño institucional.
   */
  mostrarError(titulo: string, mensaje: string, subtitulo?: string): Observable<any> {
    return this.confirmar({
      titulo: titulo || 'Error en la Operación',
      subtitulo: subtitulo || 'No fue posible completar la acción',
      icono: 'error',
      tipo: 'error',
      mensajePrincipal: mensaje,
      soloAceptar: true,
      btnConfirmarTexto: 'Aceptar'
    });
  }

  /**
   * Muestra un modal informativo.
   */
  mostrarInformativo(titulo: string, mensaje: string, subtitulo?: string): Observable<any> {
    return this.confirmar({
      titulo: titulo || 'Información',
      subtitulo: subtitulo || '',
      icono: 'info',
      tipo: 'info',
      mensajePrincipal: mensaje,
      soloAceptar: true,
      btnConfirmarTexto: 'Entendido'
    });
  }
}
