import { Observable } from 'rxjs';

/** Opción de un select/multi-select */
export interface SelectOption {
  label: string;
  value: number | string;
}

/** Configuración de una columna del filtro paramétrico */
export interface FilterColumnConfig {
  /** Nombre del campo en el DTO (ej: 'idsCategoria') */
  key: string;
  /** Cabecera visible */
  label: string;
  /** Tipo de filtro */
  type: 'multi-select' | 'range-number' | 'range-date' | 'text-search';
  /** Opciones estáticas para multi-select */
  options?: SelectOption[];
  /** URL para cargar opciones dinámicamente desde API de catálogo */
  optionsUrl?: string;
  /** Campo a usar como valor (default: 'id') */
  optionsValueField?: 'id' | 'nombre';
  /** Observable de opciones (alternativa a optionsUrl) */
  options$?: Observable<SelectOption[]>;
  /** Clave de otra columna de la que dependen las opciones (ej: 'idsCategoria') */
  dependsOn?: string;
  /** Endpoint para cargar opciones filtradas por categoría (ej: 'empaquetamiento/por-categoria') */
  optionsByCategoriaUrl?: string;
  /** Unidad para range (ej: '$', 'und', 'kg') */
  unit?: string;
  /** Mostrar input de búsqueda dentro del select */
  searchable?: boolean;
  /** Placeholder para búsqueda interna */
  searchPlaceholder?: string;
  /** Ancho personalizado para la columna (ej: '280px') */
  width?: string;
  /** Ancho mínimo para la columna (ej: '280px') */
  minWidth?: string;
  /** Ancho máximo para la columna (ej: '380px') */
  maxWidth?: string;
}

/** Filtro aplicado (se muestra como breadcrumb/chip) */
export interface AppliedFilter {
  key: string;
  label: string;
  value: string;
  removable: boolean;
}

/** Configuración completa del panel de filtro paramétrico */
export interface ParametricFilterConfig {
  /** Columnas del filtro */
  columns: FilterColumnConfig[];
  /** Mostrar toggle "Filtrado inteligente" */
  showSmartFilterToggle?: boolean;
  /** Texto personalizado para el toggle de filtrado inteligente */
  smartFilterLabel?: string;
  /** Texto del placeholder de búsqueda global */
  searchPlaceholder?: string;
  /** Debounce para búsqueda texto (ms, default 400) */
  debounceMs?: number;
}
