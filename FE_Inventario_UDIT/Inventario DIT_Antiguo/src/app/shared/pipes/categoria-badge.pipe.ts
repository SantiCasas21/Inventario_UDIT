import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'categoriaBadge',
  standalone: true
})
export class CategoriaBadgePipe implements PipeTransform {
  transform(categoriaNombre: string | undefined | null): string {
    if (!categoriaNombre) return 'badge-cat-otro';

    const cat = categoriaNombre.toLowerCase().trim();

    if (cat.includes('resistencia') || cat.includes('resistor')) {
      return 'badge-cat-resistencia';
    }
    if (cat.includes('condensador') || cat.includes('capacitor')) {
      return 'badge-cat-condensador';
    }
    if (cat.includes('inductor') || cat.includes('bobina')) {
      return 'badge-cat-inductor';
    }
    if (cat.includes('transistor') || cat.includes('mosfet')) {
      return 'badge-cat-transistor';
    }
    if (cat.includes('diodo') || cat.includes('led')) {
      return 'badge-cat-diodo';
    }
    if (cat.includes('cable') || cat.includes('conector') || cat.includes('cableado')) {
      return 'badge-cat-cable';
    }
    if (cat.includes('micro') || cat.includes('chip') || cat.includes('integrado') || cat.includes('sensor')) {
      return 'badge-cat-micro';
    }
    if (cat.includes('herramienta') || cat.includes('instrumento') || cat.includes('equipo')) {
      return 'badge-cat-herramienta';
    }

    return 'badge-cat-otro';
  }
}
