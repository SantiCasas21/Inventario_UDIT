import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { RoleGuard } from 'app/core/auth/guards/role.guard';
import { LayoutComponent } from 'app/layout/layout.component';

export const appRoutes: Route[] = [

  // Redirect empty path to '/dashboard'
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'dashboard' },

  // ============================================================
  // AUTH — invitados (sin sesión)
  // ============================================================
  {
    path: '',
    canActivate: [NoAuthGuard],
    canActivateChild: [NoAuthGuard],
    component: LayoutComponent,
    data: { layout: 'empty' },
    children: [
      { path: 'sign-in', loadChildren: () => import('app/features/auth/sign-in/sign-in.routes') },
      { path: 'sign-up', loadChildren: () => import('app/features/auth/sign-up/sign-up.routes') },
    ],
  },

  // ============================================================
  // AUTH — usuarios autenticados
  // ============================================================
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    data: { layout: 'empty' },
    children: [
      { path: 'sign-out', loadChildren: () => import('app/features/auth/sign-out/sign-out.routes') },
      { 
        path: 'cambiar-password-inicial', 
        loadComponent: () => import('app/features/auth/cambiar-password-inicial/cambiar-password-inicial.component').then(m => m.CambiarPasswordInicialComponent) 
      },
    ],
  },


  // ============================================================
  // APP — páginas protegidas (con permisos y roles granulares)
  // ============================================================
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    resolve: { initialData: initialDataResolver },
    children: [
      // ── Principal ──────────────────────────────────────────
      { path: 'dashboard', loadChildren: () => import('app/features/dashboard/dashboard.routes') },
      { path: 'perfil', loadChildren: () => import('app/features/perfil/perfil.routes') },

      // ── Inventario ─────────────────────────────────────────

      {
        path: 'inventario',
        canActivate: [RoleGuard],
        data: { permission: ['insumos.ver', 'movimientos.ver'] },
        loadComponent: () => import('app/features/hubs/inventario-hub.component').then(m => m.InventarioHubComponent)
      },
      {
        path: 'insumos',
        canActivate: [RoleGuard],
        data: { permission: 'insumos.ver' },
        loadChildren: () => import('app/features/insumos/insumos.routes')
      },
      {
        path: 'movimientos',
        canActivate: [RoleGuard],
        data: { permission: 'movimientos.ver' },
        loadChildren: () => import('app/features/movimientos/movimientos.routes')
      },

      // ── Reportes ───────────────────────────────────────────
      {
        path: 'reportes',
        canActivate: [RoleGuard],
        data: { permission: 'reportes.ver' },
        loadChildren: () => import('app/features/reportes/reportes.routes')
      },

      // ── Sistema y Control ──────────────────────────────────
      {
        path: 'sistema',
        canActivate: [RoleGuard],
        data: { permission: ['usuarios.ver', 'roles.gestionar', 'auditoria.ver'] },
        loadComponent: () => import('app/features/hubs/sistema-hub.component').then(m => m.SistemaHubComponent)
      },
      {
        path: 'usuarios',
        canActivate: [RoleGuard],
        data: { permission: 'usuarios.ver' },
        loadChildren: () => import('app/features/usuarios/usuarios.routes')
      },
      {
        path: 'roles-permisos',
        canActivate: [RoleGuard],
        data: { permission: 'roles.gestionar' },
        loadChildren: () => import('app/features/roles/roles-permisos.routes').then(m => m.rolesRoutes)
      },
      {
        path: 'auditoria',
        canActivate: [RoleGuard],
        data: { permission: 'auditoria.ver' },
        loadChildren: () => import('app/modules/admin/apps/auditoria/auditoria.routes')
      },

      // ── Catálogos Maestros ─────────────────────────────────
      {
        path: 'catalogos',
        canActivate: [RoleGuard],
        data: {
          permission: [
            'catalogos.categorias.ver', 'catalogos.unidades.ver', 'catalogos.empaquetamiento.ver',
            'catalogos.ubicaciones.ver', 'catalogos.proveedores.ver', 'catalogos.proyectos.ver',
            'catalogos.tipocompra.ver', 'catalogos.estadoproyecto.ver', 'catalogos.estadosalida.ver'
          ]
        },
        loadComponent: () => import('app/features/hubs/catalogos-hub.component').then(m => m.CatalogosHubComponent)
      },
      {
        path: 'categorias',
        canActivate: [RoleGuard],
        data: { permission: 'catalogos.categorias.ver' },
        loadChildren: () => import('app/modules/admin/apps/inventario/nombreinsumo/nombreinsumo.routes')
      },
      {
        path: 'unidades-medida',
        canActivate: [RoleGuard],
        data: { permission: 'catalogos.unidades.ver' },
        loadChildren: () => import('app/modules/admin/apps/inventario/unidad-medida/unidad-medida.routes')
      },
      {
        path: 'empaquetamiento',
        canActivate: [RoleGuard],
        data: { permission: 'catalogos.empaquetamiento.ver' },
        loadChildren: () => import('app/modules/admin/apps/inventario/empaquetamiento/empaquetamiento.routes')
      },
      {
        path: 'ubicaciones',
        canActivate: [RoleGuard],
        data: { permission: 'catalogos.ubicaciones.ver' },
        loadChildren: () => import('app/modules/admin/apps/inventario/ubicaciones/ubicaciones.routes')
      },
      {
        path: 'proveedores',
        canActivate: [RoleGuard],
        data: { permission: 'catalogos.proveedores.ver' },
        loadChildren: () => import('app/modules/admin/apps/inventario/proveedores/proveedores.routes')
      },
      {
        path: 'proyectos',
        canActivate: [RoleGuard],
        data: { permission: 'catalogos.proyectos.ver' },
        loadChildren: () => import('app/modules/admin/apps/inventario/proyectos/proyectos.routes')
      },
      {
        path: 'tipocompra',
        canActivate: [RoleGuard],
        data: { permission: 'catalogos.tipocompra.ver' },
        loadChildren: () => import('app/modules/admin/apps/inventario/tipocompra/tipocompra.routes')
      },
      {
        path: 'estadoproyecto',
        canActivate: [RoleGuard],
        data: { permission: 'catalogos.estadoproyecto.ver' },
        loadChildren: () => import('app/modules/admin/apps/inventario/estadoproyecto/estadoproyecto.routes')
      },
      {
        path: 'estadosalida',
        canActivate: [RoleGuard],
        data: { permission: 'catalogos.estadosalida.ver' },
        loadChildren: () => import('app/modules/admin/apps/inventario/estadosalida/estadosalida.routes')
      },

    ],
  },
];
