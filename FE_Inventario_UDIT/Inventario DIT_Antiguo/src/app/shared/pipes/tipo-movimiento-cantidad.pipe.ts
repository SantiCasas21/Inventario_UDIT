import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tipoMovimientoCantidad',
  standalone: true
})
export class TipoMovimientoCantidadPipe implements PipeTransform {
  transform(tipo: string | undefined | null): string {
    const t = (tipo || '').toUpperCase().trim();
    switch (t) {
      case 'INGRESO': return 'badge-success';
      case 'SALIDA': return 'badge-error';
      default: return 'badge-warning'; // Ajuste, Traslado, Unificar etc.
    }
  }
}
