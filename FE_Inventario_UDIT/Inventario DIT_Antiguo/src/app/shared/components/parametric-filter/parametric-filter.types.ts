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
  /** Observable de opciones (alternativa a optionsUrl) */
  options$?: Observable<SelectOption[]>;
  /** Unidad para range (ej: '$', 'und', 'kg') */
  unit?: string;
  /** Mostrar input de búsqueda dentro del select */
  searchable?: boolean;
  /** Placeholder para búsqueda interna */
  searchPlaceholder?: string;
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
  /** Texto del placeholder de búsqueda global */
  searchPlaceholder?: string;
  /** Debounce para búsqueda texto (ms, default 400) */
  debounceMs?: number;
}
