import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tipoMovimientoBadge',
  standalone: true
})
export class TipoMovimientoBadgePipe implements PipeTransform {
  transform(tipo: string | undefined | null): string {
    const t = (tipo || '').toUpperCase().trim();
    switch (t) {
      case 'INGRESO':
      case 'CREAR': return 'badge-ingreso';
      case 'SALIDA':
      case 'ELIMINAR': return 'badge-salida';
      case 'AJUSTE': return 'badge-ajuste';
      case 'EDITAR': return 'badge-editar';
      case 'UNIFICAR':
      case 'UNIFICACION': return 'badge-unificar';
      case 'TRASLADO': return 'badge-traslado';
      case 'CONSULTAR':
      case 'CONSULTA': return 'badge-consultar';
      case 'EXPORTAR':
      case 'EXPORTACION': return 'badge-exportar';
      default: return 'badge-info';
    }
  }
}
