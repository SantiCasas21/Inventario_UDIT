/**
 * Define un permiso disponible en el sistema, con metadata para la UI.
 */
export interface PermissionDefinition {
  /** Valor único del permiso, ej: "insumos.ver" */
  value: string;
  /** Etiqueta legible para el usuario, ej: "Ver Insumos" */
  label: string;
  /** Módulo al que pertenece, ej: "Insumos" */
  module: string;
  /** Descripción detallada del permiso */
  description: string;
}

/**
 * Rol con su lista de permisos asignados.
 */
export interface RolePermissions {
  roleName: string;
  permissions: string[];
}

/**
 * Permisos agrupados por módulo para la UI del árbol.
 */
export interface PermissionGroup {
  module: string;
  permissions: PermissionDefinition[];
}

/**
 * Configuración visual de un rol para el árbol de UI.
 */
export interface RoleVisualConfig {
  name: string;
  label: string;
  icon: string;
  color: string;
  badgeClass: string;
}
