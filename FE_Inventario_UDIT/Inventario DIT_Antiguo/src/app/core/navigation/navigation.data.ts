import { FuseNavigationItem } from '@fuse/components/navigation';

/**
 * Navegación estática para Inventario UDIT.
 * Solo incluye rutas que ya están implementadas.
 */
export const NAVIGATION_ITEMS: FuseNavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/dashboard',
  },
  {
    id: 'inventario',
    title: 'Inventario',
    type: 'collapsable',
    icon: 'heroicons_outline:circle-stack',
    children: [
      { id: 'insumos', title: 'Insumos', type: 'basic', link: '/insumos' },
      { id: 'movimientos', title: 'Movimientos', type: 'basic', link: '/movimientos' },
    ],
  },
  {
    id: 'reportes',
    title: 'Reportes',
    type: 'collapsable',
    icon: 'heroicons_outline:document-chart-bar',
    children: [
      { id: 'reportes', title: 'Todos los Reportes', type: 'basic', link: '/reportes' },
    ],
  },
  {
    id: 'admin',
    title: 'Administración',
    type: 'collapsable',
    icon: 'heroicons_outline:cog-6-tooth',
    children: [
      { id: 'usuarios', title: 'Usuarios', type: 'basic', link: '/usuarios' },
      { id: 'empaquetamiento', title: 'Empaquetamiento', type: 'basic', link: '/empaquetamiento' },
      { id: 'estadoproyecto', title: 'Estado Proyecto', type: 'basic', link: '/estadoproyecto' },
      { id: 'estadosalida', title: 'Estado Salida', type: 'basic', link: '/estadosalida' },
      { id: 'categorias', title: 'Categorías', type: 'basic', link: '/categorias' },
      { id: 'proveedores', title: 'Proveedores', type: 'basic', link: '/proveedores' },
      { id: 'proyectos', title: 'Proyectos', type: 'basic', link: '/proyectos' },
      { id: 'tipocompra', title: 'Tipo Compra', type: 'basic', link: '/tipocompra' },
      { id: 'ubicaciones', title: 'Ubicaciones', type: 'basic', link: '/ubicaciones' },
    ],
  },
];
