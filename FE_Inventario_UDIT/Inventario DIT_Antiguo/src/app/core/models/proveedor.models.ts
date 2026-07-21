/** DTO completo para Proveedor con todos sus campos. */
export interface ProveedorFullDto {
  id: number;
  nombre: string;
  contacto: string | null;
  direccion: string | null;
}

/** DTO para crear/actualizar un Proveedor completo. */
export interface ProveedorFullRequest {
  nombre: string;
  contacto?: string;
  direccion?: string;
}
