import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { RoleManagementService } from '@app/core/services/role-management.service';
import { PermissionDefinition, PermissionGroup, RolePermissions, RoleVisualConfig } from 'interfaces/role-permissions';

@Component({
  selector: 'app-roles-permisos',
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatCheckboxModule, MatTooltipModule, MatSnackBarModule,
    MatProgressSpinnerModule, MatChipsModule, MatInputModule, MatFormFieldModule
  ],
  templateUrl: './roles-permisos.component.html',
  styleUrls: ['./roles-permisos.component.scss']
})
export class RolesPermisosComponent implements OnInit, OnDestroy {

  // ── Estado general ───────────────────────────────────────────────────────
  loading = true;
  saving = false;
  error: string | null = null;

  // ── Filtros y Búsqueda ──────────────────────────────────────────────────
  searchQuery: string = '';
  selectedRoleTab: string = 'ALL';

  // ── Datos del backend ────────────────────────────────────────────────────
  availablePermissions: PermissionDefinition[] = [];
  permissionGroups: PermissionGroup[] = [];
  rolesPermissions: RolePermissions[] = [];

  /** Mapa mutable de permisos por rol. Se modifica en la tabla interactiva. */
  pendingChanges: Record<string, Set<string>> = {};

  // ── Configuración visual de roles ───────────────────────────────────────
  readonly roleConfigs: RoleVisualConfig[] = [
    { name: 'Admin',     label: 'Admin',     icon: 'admin_panel_settings', color: '#B11F16', badgeClass: 'badge-role-admin' },
    { name: 'Developer', label: 'Developer', icon: 'build',                color: '#1472B8', badgeClass: 'badge-role-developer' },
    { name: 'Assistant', label: 'Assistant', icon: 'inventory_2',          color: '#D97706', badgeClass: 'badge-role-assistant' },
    { name: 'User',      label: 'User',      icon: 'visibility',           color: '#065f46', badgeClass: 'badge-role-user' },
  ];


  /** Roles ordenados según roleConfigs */
  get orderedRoles(): RolePermissions[] {
    return this.roleConfigs
      .map(cfg => this.rolesPermissions.find(r => r.roleName === cfg.name))
      .filter((r): r is RolePermissions => !!r);
  }

  private destroy$ = new Subject<void>();

  constructor(
    private roleService: RoleManagementService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Carga de datos ───────────────────────────────────────────────────────

  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      permissions: this.roleService.getAvailablePermissions(),
      roles: this.roleService.getAllRolesPermissions()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ permissions, roles }) => {
        this.availablePermissions = permissions;
        this.permissionGroups = this.buildPermissionGroups(permissions);
        this.rolesPermissions = roles;
        this.initPendingChanges(roles);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar datos: ' + (err.message || 'Error de conexión');
        this.loading = false;
      }
    });
  }

  /** Agrupa permisos por módulo para el árbol visual y la tabla */
  private buildPermissionGroups(permissions: PermissionDefinition[]): PermissionGroup[] {
    const groupMap = new Map<string, PermissionDefinition[]>();
    permissions.forEach(p => {
      if (!groupMap.has(p.module)) groupMap.set(p.module, []);
      groupMap.get(p.module)!.push(p);
    });
    return Array.from(groupMap.entries()).map(([module, perms]) => ({ module, permissions: perms }));
  }

  /** Inicializa el mapa de cambios pendientes a partir del estado actual de los roles */
  private initPendingChanges(roles: RolePermissions[]): void {
    this.pendingChanges = {};
    const validPermValues = new Set(this.availablePermissions.map(p => p.value));

    roles.forEach(r => {
      if (this.isAdmin(r.roleName)) {
        this.pendingChanges[r.roleName] = new Set(validPermValues);
      } else {
        // Filtrar cualquier permiso obsoleto que venga de la base de datos
        const sanitized = (r.permissions || []).filter(p => validPermValues.has(p));
        this.pendingChanges[r.roleName] = new Set(sanitized);
      }
    });

    // Asegurar que Admin tenga siempre el 100% de los permisos disponibles
    if (!this.pendingChanges['Admin']) {
      this.pendingChanges['Admin'] = new Set(validPermValues);
    }
  }

  // ── Interacción de la tabla ──────────────────────────────────────────────

  /** ¿Tiene el rol determinado permiso activo (en los cambios pendientes)? */
  hasPermission(roleName: string, permissionValue: string): boolean {
    if (this.isAdmin(roleName)) return true;
    return this.pendingChanges[roleName]?.has(permissionValue) ?? false;
  }

  /** ¿Es el Admin? — sus checkboxes están siempre deshabilitados */
  isAdmin(roleName: string): boolean {
    return roleName === 'Admin';
  }

  /** Cambia el estado de un checkbox */
  togglePermission(roleName: string, permissionValue: string, checked: boolean): void {
    if (this.isAdmin(roleName)) return;
    if (checked) {
      this.pendingChanges[roleName]?.add(permissionValue);
    } else {
      this.pendingChanges[roleName]?.delete(permissionValue);
    }
  }

  /** Devuelve true si hay cambios sin guardar en algún rol */
  get hasPendingChanges(): boolean {
    const validPermValues = new Set(this.availablePermissions.map(p => p.value));
    return this.rolesPermissions.some(role => {
      if (this.isAdmin(role.roleName)) return false;
      const original = new Set<string>((role.permissions || []).filter(p => validPermValues.has(p)));
      const pending = this.pendingChanges[role.roleName] || new Set<string>();
      if (original.size !== pending.size) return true;
      return [...original].some((p: string) => !pending.has(p));
    });
  }

  // ── Guardado ─────────────────────────────────────────────────────────────

  saveChanges(): void {
    this.saving = true;
    const validPermValues = new Set(this.availablePermissions.map(p => p.value));

    const modifiedRoles = this.rolesPermissions
      .filter(role => {
        if (this.isAdmin(role.roleName)) return false;
        const original = new Set<string>((role.permissions || []).filter(p => validPermValues.has(p)));
        const pending = this.pendingChanges[role.roleName] || new Set<string>();
        if (original.size !== pending.size) return true;
        return [...original].some((p: string) => !pending.has(p));
      });

    if (modifiedRoles.length === 0) {
      this.snackBar.open('No hay cambios que guardar.', 'Cerrar', { duration: 3000 });
      this.saving = false;
      return;
    }

    // Actualizar cada rol modificado secuencialmente
    const updates$ = modifiedRoles.map(role => {
      const cleanPerms = [...(this.pendingChanges[role.roleName] || [])].filter(p => validPermValues.has(p));
      return this.roleService.updateRolePermissions(role.roleName, cleanPerms);
    });

    forkJoin(updates$)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(
            `Permisos actualizados para: ${modifiedRoles.map(r => r.roleName).join(', ')}`,
            'Cerrar',
            { duration: 5000 }
          );
          this.saving = false;
          this.loadData(); // Recargar datos actualizados
        },
        error: (err) => {
          this.snackBar.open('Error al guardar: ' + (err.message || 'Error inesperado'), 'Cerrar', { duration: 8000 });
          this.saving = false;
        }
      });
  }


  /** Descarta los cambios pendientes y restaura el estado original */
  discardChanges(): void {
    this.initPendingChanges(this.rolesPermissions);
    this.snackBar.open('Cambios descartados.', 'Cerrar', { duration: 3000 });
  }

  // ── Árbol visual ─────────────────────────────────────────────────────────

  /** Retorna los permisos activos de un rol, agrupados por módulo (para el árbol) */
  getActivePermissionsGrouped(roleName: string): PermissionGroup[] {
    if (this.isAdmin(roleName)) {
      return this.permissionGroups;
    }
    const active = this.pendingChanges[roleName] ?? new Set<string>();
    return this.permissionGroups
      .map(group => ({
        module: group.module,
        permissions: group.permissions.filter(p => active.has(p.value))
      }))
      .filter(g => g.permissions.length > 0);
  }


  /** Config visual de un rol */
  getRoleConfig(roleName: string): RoleVisualConfig | undefined {
    return this.roleConfigs.find(c => c.name === roleName);
  }

  /** Icono por módulo */
  getModuleIcon(module: string): string {
    const icons: Record<string, string> = {
      'Insumos': 'inventory_2',
      'Movimientos': 'swap_horiz',
      'Reportes': 'analytics',
      'Catálogos Maestros': 'table_chart',
      'Catálogos': 'table_chart',
      'Sistema y Control': 'shield',
      'Usuarios': 'manage_accounts',
      'Auditoría': 'security',
    };
    return icons[module] || 'folder';
  }

  // ── Métricas y Contadores de Roles ───────────────────────────────────────
  getRolePermissionCount(roleName: string): number {
    if (this.isAdmin(roleName)) return this.availablePermissions.length;
    return this.pendingChanges[roleName]?.size ?? 0;
  }

  getRolePermissionPercent(roleName: string): number {
    if (!this.availablePermissions.length) return 0;
    const count = this.getRolePermissionCount(roleName);
    return Math.round((count / this.availablePermissions.length) * 100);
  }

  // ── Configuración de Roles visibles según pestaña ────────────────────────
  get visibleRoleConfigs(): RoleVisualConfig[] {
    if (this.selectedRoleTab === 'ALL') {
      return this.roleConfigs;
    }
    return this.roleConfigs.filter(r => r.name === this.selectedRoleTab);
  }

  // ── Grupos de Permisos filtrados por búsqueda ────────────────────────────
  get filteredPermissionGroups(): PermissionGroup[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return this.permissionGroups;

    return this.permissionGroups
      .map(group => {
        const matchesModule = group.module.toLowerCase().includes(query);
        const filteredPerms = group.permissions.filter(p =>
          matchesModule ||
          p.label.toLowerCase().includes(query) ||
          p.value.toLowerCase().includes(query) ||
          (p.description && p.description.toLowerCase().includes(query))
        );
        return {
          module: group.module,
          permissions: filteredPerms
        };
      })
      .filter(g => g.permissions.length > 0);
  }

  // ── Acciones en Lote por Módulo ──────────────────────────────────────────
  isModuleAllChecked(module: string, roleName: string): boolean {
    if (this.isAdmin(roleName)) return true;
    const group = this.permissionGroups.find(g => g.module === module);
    if (!group || !group.permissions.length) return false;
    const active = this.pendingChanges[roleName] || new Set<string>();
    return group.permissions.every(p => active.has(p.value));
  }

  isModuleIndeterminate(module: string, roleName: string): boolean {
    if (this.isAdmin(roleName)) return false;
    const group = this.permissionGroups.find(g => g.module === module);
    if (!group || !group.permissions.length) return false;
    const active = this.pendingChanges[roleName] || new Set<string>();
    const count = group.permissions.filter(p => active.has(p.value)).length;
    return count > 0 && count < group.permissions.length;
  }

  toggleModulePermissions(module: string, roleName: string): void {
    if (this.isAdmin(roleName)) return;
    const group = this.permissionGroups.find(g => g.module === module);
    if (!group) return;

    const allChecked = this.isModuleAllChecked(module, roleName);
    const targetSet = this.pendingChanges[roleName] || new Set<string>();

    group.permissions.forEach(p => {
      if (allChecked) {
        targetSet.delete(p.value);
      } else {
        targetSet.add(p.value);
      }
    });
    this.pendingChanges[roleName] = targetSet;
  }
}

