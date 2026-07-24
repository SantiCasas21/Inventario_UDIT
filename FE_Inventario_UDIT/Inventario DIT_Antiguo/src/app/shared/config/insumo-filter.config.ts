import { ParametricFilterConfig } from '@shared/components/parametric-filter/parametric-filter.types';

/** Configuración del filtro paramétrico para la página de Insumos */
export const INSUMO_FILTER_CONFIG: ParametricFilterConfig = {
  showSmartFilterToggle: true,
  debounceMs: 400,
  columns: [
    {
      key: 'textSearch',
      label: 'Código Fabricante',
      type: 'text-search',
      searchPlaceholder: 'Cód. Fábrica / Descripción...',
    },
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
      key: 'valorMedidaRange',
      label: 'Valor Unidad',
      type: 'range-number',
    },
  ],
};
