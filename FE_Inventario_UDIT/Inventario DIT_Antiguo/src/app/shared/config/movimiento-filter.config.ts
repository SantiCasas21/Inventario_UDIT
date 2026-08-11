import { ParametricFilterConfig } from '@shared/components/parametric-filter/parametric-filter.types';

/** Configuración del filtro paramétrico para la página de Movimientos */
export const MOVIMIENTO_FILTER_CONFIG: ParametricFilterConfig = {
  showSmartFilterToggle: true,
  debounceMs: 400,
  columns: [
    {
      key: 'tiposMovimiento',
      label: 'Tipo',
      type: 'multi-select',
      options: [
        { label: 'Ingreso', value: 'INGRESO' },
        { label: 'Salida', value: 'SALIDA' },
        { label: 'Ajuste', value: 'AJUSTE' },
        { label: 'Unificar', value: 'UNIFICAR' },
        { label: 'Traslado', value: 'TRASLADO' },
      ],
      searchable: false,
    },
    {
      key: 'codigoFabricaSearch',
      label: 'Código Fabricante',
      type: 'text-search',
      searchPlaceholder: 'Cód. Fábrica...',
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
      key: 'idsProveedor',
      label: 'Proveedor',
      type: 'multi-select',
      optionsUrl: 'proveedor-full',
      searchable: true,
      searchPlaceholder: 'Buscar...',
    },
    {
      key: 'idsProyecto',
      label: 'Proyecto',
      type: 'multi-select',
      optionsUrl: 'proyecto',
      searchable: true,
      searchPlaceholder: 'Buscar...',
    },
    {
      key: 'idsTipoCompra',
      label: 'Tipo Compra',
      type: 'multi-select',
      optionsUrl: 'tipo-compra',
      searchable: true,
      searchPlaceholder: 'Buscar...',
    },
    {
      key: 'idsEstadoSalida',
      label: 'Estado Salida',
      type: 'multi-select',
      optionsUrl: 'estado-salida',
      searchable: true,
      searchPlaceholder: 'Buscar...',
    },
    {
      key: 'cantidadRange',
      label: 'Cantidad',
      type: 'range-number',
      unit: 'und',
    },
    {
      key: 'fechaRange',
      label: 'Fecha',
      type: 'range-date',
    },
  ],
};
