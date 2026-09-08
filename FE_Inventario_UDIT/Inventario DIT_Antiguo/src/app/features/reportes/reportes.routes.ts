import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () => import('./hub/reportes-hub.component').then(m => m.ReportesHubComponent),
  },
  {
    path: 'kardex',
    loadComponent: () => import('./kardex/reporte-kardex.component').then(m => m.ReporteKardexComponent),
  },
  {
    path: 'stock-critico',
    loadComponent: () => import('./stock-critico/reporte-stock-critico.component').then(m => m.ReporteStockCriticoComponent),
  },
  {
    path: 'movimientos',
    loadComponent: () => import('./movimientos/reporte-movimientos.component').then(m => m.ReporteMovimientosComponent),
  },
  {
    path: 'proyectos',
    loadComponent: () => import('./proyectos/reporte-proyectos.component').then(m => m.ReporteProyectosComponent),
  },
] as Routes;
