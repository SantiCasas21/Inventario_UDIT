import { FuseNavigationItem } from '@fuse/components/navigation';

/**
 * Estructura de navegación para Inventario UDIT.
 * Cada categoría colapsable tiene su ruta HUB directa (link) para que al hacer clic
 * en ella se abra el HUB visual y se desplieguen sus subpáginas simultáneamente.
 */
export const NAVIGATION_ITEMS: FuseNavigationItem[] = [
  // ── 1. PRINCIPAL ──────────────────────────────────────────────
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'basic',
    icon: 'heroicons_outline:home',
    link: '/dashboard',
  },

  // ── 2. INVENTARIO ─────────────────────────────────────────────
  {
    id: 'inventario',
    title: 'Inventario',
    type: 'collapsable',
    icon: 'heroicons_outline:circle-stack',
    link: '/inventario',
    children: [
      {
        id: 'insumos',
        title: 'Insumos',
        type: 'basic',
        icon: 'heroicons_outline:cube',
        link: '/insumos',
        meta: { permission: 'insumos.ver' },
      },
      {
        id: 'movimientos',
        title: 'Movimientos',
        type: 'basic',
        icon: 'heroicons_outline:arrows-right-left',
        link: '/movimientos',
        meta: { permission: 'movimientos.ver' },
      },
    ],
  },

  // ── 3. REPORTES ───────────────────────────────────────────────
  {
    id: 'reportes-seccion',
    title: 'Reportes',
    type: 'collapsable',
    icon: 'heroicons_outline:document-chart-bar',
    link: '/reportes',
    children: [
      {
        id: 'reporte-kardex',
        title: 'Kardex por Insumo',
        type: 'basic',
        icon: 'heroicons_outline:table-cells',
        link: '/reportes/kardex',
        meta: { permission: 'reportes.ver' },
      },
      {
        id: 'reporte-stock-critico',
        title: 'Stock Crítico',
        type: 'basic',
        icon: 'heroicons_outline:exclamation-triangle',
        link: '/reportes/stock-critico',
        meta: { permission: 'reportes.ver' },
      },
      {
        id: 'reporte-movimientos',
        title: 'Movimientos por Período',
        type: 'basic',
        icon: 'heroicons_outline:calendar-days',
        link: '/reportes/movimientos',
        meta: { permission: 'reportes.ver' },
      },
      {
        id: 'reporte-proyectos',
        title: 'Consumo por Proyecto',
        type: 'basic',
        icon: 'heroicons_outline:briefcase',
        link: '/reportes/proyectos',
        meta: { permission: 'reportes.ver' },
      },
    ],
  },

  // ── 4. CATÁLOGOS MAESTROS ─────────────────────────────────────
  {
    id: 'catalogos',
    title: 'Catálogos Maestros',
    type: 'collapsable',
    icon: 'heroicons_outline:squares-2x2',
    link: '/catalogos',
    children: [
      {
        id: 'categorias',
        title: 'Categorías',
        type: 'basic',
        icon: 'heroicons_outline:tag',
        link: '/categorias',
        meta: { permission: 'catalogos.categorias.ver' },
      },
      {
        id: 'unidades-medida',
        title: 'Unidades de Medida',
        type: 'basic',
        icon: 'heroicons_outline:scale',
        link: '/unidades-medida',
        meta: { permission: 'catalogos.unidades.ver' },
      },
      {
        id: 'empaquetamiento',
        title: 'Empaquetamiento',
        type: 'basic',
        icon: 'heroicons_outline:archive-box',
        link: '/empaquetamiento',
        meta: { permission: 'catalogos.empaquetamiento.ver' },
      },
      {
        id: 'ubicaciones',
        title: 'Ubicaciones',
        type: 'basic',
        icon: 'heroicons_outline:map-pin',
        link: '/ubicaciones',
        meta: { permission: 'catalogos.ubicaciones.ver' },
      },
      {
        id: 'proveedores',
        title: 'Proveedores',
        type: 'basic',
        icon: 'heroicons_outline:truck',
        link: '/proveedores',
        meta: { permission: 'catalogos.proveedores.ver' },
      },
      {
        id: 'proyectos',
        title: 'Proyectos',
        type: 'basic',
        icon: 'heroicons_outline:folder',
        link: '/proyectos',
        meta: { permission: 'catalogos.proyectos.ver' },
      },
      {
        id: 'tipocompra',
        title: 'Tipos de Compra',
        type: 'basic',
        icon: 'heroicons_outline:credit-card',
        link: '/tipocompra',
        meta: { permission: 'catalogos.tipocompra.ver' },
      },
      {
        id: 'estadoproyecto',
        title: 'Estados de Proyecto',
        type: 'basic',
        icon: 'heroicons_outline:clipboard-document-check',
        link: '/estadoproyecto',
        meta: { permission: 'catalogos.estadoproyecto.ver' },
      },

      {
        id: 'estadosalida',
        title: 'Estados de Salida',
        type: 'basic',
        icon: 'heroicons_outline:arrow-up-tray',
        link: '/estadosalida',
        meta: { permission: 'catalogos.estadosalida.ver' },
      },
    ],
  },

  // ── 5. SISTEMA Y CONTROL ──────────────────────────────────────
  {
    id: 'sistema',
    title: 'Sistema y Control',
    type: 'collapsable',
    icon: 'heroicons_outline:cog-6-tooth',
    link: '/sistema',
    children: [
      {
        id: 'usuarios',
        title: 'Usuarios',
        type: 'basic',
        icon: 'heroicons_outline:users',
        link: '/usuarios',
        meta: { permission: 'usuarios.ver' },
      },
      {
        id: 'roles-permisos',
        title: 'Roles y Permisos',
        type: 'basic',
        icon: 'heroicons_outline:shield-check',
        link: '/roles-permisos',
        meta: { permission: 'roles.gestionar' },
      },
      {
        id: 'auditoria',
        title: 'Auditoría / Logs',
        type: 'basic',
        icon: 'heroicons_outline:clock',
        link: '/auditoria',
        meta: { permission: 'auditoria.ver' },
      },
    ],
  },
];
