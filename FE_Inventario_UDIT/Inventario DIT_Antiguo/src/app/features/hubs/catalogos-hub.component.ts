import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '@app/core/user/user.service';

interface CatalogCard {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  link: string;
  permission: string;
}

@Component({
  selector: 'app-catalogos-hub',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './catalogos-hub.component.html',
  styleUrls: ['./catalogos-hub.component.scss']
})
export class CatalogosHubComponent {
  private userService = inject(UserService);

  catalogs: CatalogCard[] = [
    {
      title: 'Categorías de Insumos',
      subtitle: 'Clasificación y Familias',
      description: 'Definición de familias y categorías de insumos para agrupación lógica en el inventario.',
      icon: 'folder',
      color: '#6366f1',
      link: '/categorias',
      permission: 'catalogos.categorias.ver'
    },
    {
      title: 'Unidades de Medida',
      subtitle: 'Métricas de Inventario',
      description: 'Configuración de unidades estándar de cuantificación (metros, unidades, kilos, cajas).',
      icon: 'straighten',
      color: '#0ea5e9',
      link: '/unidades-medida',
      permission: 'catalogos.unidades.ver'
    },
    {
      title: 'Empaquetamiento',
      subtitle: 'Presentaciones Físicas',
      description: 'Gestión de tipos de presentación, empaques individuales, carretes y paquetes.',
      icon: 'inventory_2',
      color: '#8b5cf6',
      link: '/empaquetamiento',
      permission: 'catalogos.empaquetamiento.ver'
    },
    {
      title: 'Ubicaciones Físicas',
      subtitle: 'Bodegas y Estanterías',
      description: 'Control de áreas físicas de almacenamiento, pasillos, estantes y bodegas de la universidad.',
      icon: 'place',
      color: '#ec4899',
      link: '/ubicaciones',
      permission: 'catalogos.ubicaciones.ver'
    },
    {
      title: 'Proveedores',
      subtitle: 'Directorio Comercial',
      description: 'Registro de empresas y proveedores autorizados con datos de contacto y RUC/NIT.',
      icon: 'local_shipping',
      color: '#f59e0b',
      link: '/proveedores',
      permission: 'catalogos.proveedores.ver'
    },
    {
      title: 'Proyectos y Obras',
      subtitle: 'Centros de Costo / Destinos',
      description: 'Registro de proyectos de investigación, tesis, mantenimiento y carreras académicas.',
      icon: 'business_center',
      color: '#10b981',
      link: '/proyectos',
      permission: 'catalogos.proyectos.ver'
    },
    {
      title: 'Tipos de Compra',
      subtitle: 'Modalidades de Ingreso',
      description: 'Catálogo de modalidades de ingreso de material (Licitación, Compra Directa, Donación).',
      icon: 'shopping_cart',
      color: '#14b8a6',
      link: '/tipocompra',
      permission: 'catalogos.tipocompra.ver'
    },
    {
      title: 'Estados de Proyecto',
      subtitle: 'Fases de Ejecución',
      description: 'Gestión del ciclo de vida de proyectos (Activo, En Pausa, Finalizado, Cancelado).',
      icon: 'task_alt',
      color: '#84cc16',
      link: '/estadoproyecto',
      permission: 'catalogos.estadoproyecto.ver'
    },

    {
      title: 'Estados de Salida',
      subtitle: 'Motivo y Justificación',
      description: 'Catálogo de condiciones de entrega de material (Consumo Final, Préstamo, Merma).',
      icon: 'output',
      color: '#f43f5e',
      link: '/estadosalida',
      permission: 'catalogos.estadosalida.ver'
    }
  ];

  get visibleCatalogs(): CatalogCard[] {
    return this.catalogs.filter(c => this.userService.hasPermission(c.permission));
  }
}
