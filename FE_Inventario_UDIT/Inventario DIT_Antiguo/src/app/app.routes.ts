import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
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
    ],
  },

  // ============================================================
  // APP — páginas protegidas
  // ============================================================
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    resolve: { initialData: initialDataResolver },
    children: [
      { path: 'dashboard', loadChildren: () => import('app/features/dashboard/dashboard.routes') },
    ],
  },
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    resolve: { initialData: initialDataResolver },
    children: [
      { path: 'insumos', loadChildren: () => import('app/features/insumos/insumos.routes') },
    ],
  },
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    resolve: { initialData: initialDataResolver },
    children: [
      { path: 'movimientos', loadChildren: () => import('app/features/movimientos/movimientos.routes') },
    ],
  },
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    resolve: { initialData: initialDataResolver },
    children: [
      { path: 'reportes', loadChildren: () => import('app/features/reportes/reportes.routes') },
    ],
  },
  {
    path: '',
    canActivate: [AuthGuard],
    canActivateChild: [AuthGuard],
    component: LayoutComponent,
    resolve: { initialData: initialDataResolver },
    children: [
      { path: 'usuarios', loadChildren: () => import('app/features/usuarios/usuarios.routes') },
    ],
  },
];
