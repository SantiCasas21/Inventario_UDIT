import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '@app/core/user/user.service';

interface HubCard {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  link: string;
  badge: string;
  permission: string;
  features: string[];
}

@Component({
  selector: 'app-inventario-hub',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './inventario-hub.component.html',
  styleUrls: ['./inventario-hub.component.scss']
})
export class InventarioHubComponent {
  private userService = inject(UserService);

  cards: HubCard[] = [
    {
      title: 'Insumos de Inventario',
      subtitle: 'Catálogo de Existencias',
      description: 'Gestión centralizada de insumos, especificaciones técnicas, categorías, unidades de medida y control de stock físico.',
      icon: 'category',
      color: '#4f46e5',
      link: '/insumos',
      badge: 'Almacén Central',
      permission: 'insumos.ver',
      features: ['Búsqueda rápida por código y descripción', 'Creación y edición de insumos', 'Precios de referencia y familias', 'Historial de movimientos directo']
    },
    {
      title: 'Movimientos de Inventario',
      subtitle: 'Flujo y Trazabilidad',
      description: 'Registro de ingresos por compra/donación, salidas para proyectos, ajustes de stock y traslados físicos entre bodegas.',
      icon: 'swap_horiz',
      color: '#0891b2',
      link: '/movimientos',
      badge: 'Entradas y Salidas',
      permission: 'movimientos.ver',
      features: ['Registro de ingresos con proveedores', 'Salidas con estado y destino de obra', 'Ajustes con motivo y justificación', 'Validación de stock en tiempo real']
    }
  ];

  get visibleCards(): HubCard[] {
    return this.cards.filter(c => this.userService.hasPermission(c.permission));
  }
}
