import { ParametricFilterConfig } from '@shared/components/parametric-filter/parametric-filter.types';

/** Configuración del filtro paramétrico para la página de Insumos */
export const INSUMO_FILTER_CONFIG: ParametricFilterConfig = {
  showSmartFilterToggle: true,
  debounceMs: 400,
  columns: [
    {
      key: 'idsCategoria',
      label: 'Categoría',
      type: 'multi-select',
      optionsUrl: 'categoria-insumo',
      searchable: true,
      searchPlaceholder: 'Buscar categoría...',
    },
    {
      key: 'idsEmpaquetamiento',
      label: 'Empaquetamiento',
      type: 'multi-select',
      optionsUrl: 'empaquetamiento',
      searchable: true,
      searchPlaceholder: 'Buscar...',
    },
    {
      key: 'idsUbicacion',
      label: 'Ubicación',
      type: 'multi-select',
      optionsUrl: 'ubicacion',
      searchable: true,
      searchPlaceholder: 'Buscar...',
    },
    {
      key: 'precioRange',
      label: 'Precio Ref.',
      type: 'range-number',
      unit: '$',
    },
    {
      key: 'textSearch',
      label: 'Búsqueda',
      type: 'text-search',
      searchPlaceholder: 'Cód. Fabrica / Descripción',
    },
  ],
};
