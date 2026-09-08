import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '@app/core/user/user.service';

interface SystemCard {
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
  selector: 'app-sistema-hub',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './sistema-hub.component.html',
  styleUrls: ['./sistema-hub.component.scss']
})
export class SistemaHubComponent {
  private userService = inject(UserService);

  cards: SystemCard[] = [
    {
      title: 'Gestión de Usuarios',
      subtitle: 'Cuentas y Accesos',
      description: 'Administración de usuarios del inventario, asignación de roles, activación, desactivación y restablecimiento de contraseñas.',
      icon: 'manage_accounts',
      color: '#6366f1',
      link: '/usuarios',
      badge: 'Cuentas',
      permission: 'usuarios.ver',
      features: ['Creación de nuevos usuarios', 'Asignación de roles de sistema', 'Bloqueo/activación de cuentas', 'Búsqueda por usuario y correo']
    },
    {
      title: 'Roles y Permisos (RBAC)',
      subtitle: 'Seguridad y Privilegios',
      description: 'Control de acceso basado en roles. Configuración granular de permisos por módulo y catálogo maestro para cada rol.',
      icon: 'admin_panel_settings',
      color: '#4f46e5',
      link: '/roles-permisos',
      badge: 'Seguridad RBAC',
      permission: 'roles.gestionar',
      features: ['Permisos granulares por catálogo', 'Diagrama interactivo de roles', 'Matriz de asignación en tiempo real', 'Sincronización instantánea']
    },
    {
      title: 'Auditoría / Logs del Sistema',
      subtitle: 'Trazabilidad y Seguridad',
      description: 'Historial inmutable de auditoría de todas las operaciones críticas: consultas, exportaciones a Excel, creaciones y eliminaciones.',
      icon: 'security',
      color: '#059669',
      link: '/auditoria',
      badge: 'Auditoría',
      permission: 'auditoria.ver',
      features: ['Registro de exportaciones a Excel', 'Identificación de usuario y fecha/hora', 'Filtro por módulo y tipo de acción', 'Detalle de payload modificado']
    }
  ];

  get visibleCards(): SystemCard[] {
    return this.cards.filter(c => this.userService.hasPermission(c.permission));
  }
}
